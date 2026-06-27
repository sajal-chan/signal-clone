import asyncio
from datetime import datetime, timedelta
from passlib.context import CryptContext
from sqlalchemy import select
from app.db import AsyncSessionLocal, init_db
from app.models.user import User
from app.models.contact import Contact
from app.models.conversation import Conversation, ConversationMember, ConversationType, MemberRole
from app.models.message import Message, MessageReceipt, MessageReaction, MessageType, ReceiptStatus

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
HASH = pwd_context.hash("password123")
NOW = datetime.utcnow()


async def seed():
    await init_db()
    async with AsyncSessionLocal() as db:
        # Skip if already seeded
        result = await db.execute(select(User))
        if result.scalars().first():
            print("Database already seeded, skipping.")
            return

        users_data = [
            ("alice", "Alice Chen", "+1-555-0101"),
            ("bob", "Bob Martinez", "+1-555-0102"),
            ("carol", "Carol White", "+1-555-0103"),
            ("dave", "Dave Kim", "+1-555-0104"),
            ("eve", "Eve Johnson", "+1-555-0105"),
            ("frank", "Frank Lee", "+1-555-0106"),
            ("grace", "Grace Patel", "+1-555-0107"),
            ("heidi", "Heidi Nguyen", "+1-555-0108"),
        ]

        for username, display_name, phone in users_data:
            db.add(User(
                username=username,
                display_name=display_name,
                phone_number=phone,
                password_hash=HASH,
            ))
        await db.flush()

        result = await db.execute(select(User))
        u = {u.username: u for u in result.scalars().all()}
        alice, bob, carol, dave, eve, frank, grace = (
            u["alice"], u["bob"], u["carol"], u["dave"],
            u["eve"], u["frank"], u["grace"],
        )

        # Bidirectional contact pairs
        for owner, contact_user in [
            (alice, bob), (bob, alice),
            (alice, carol), (carol, alice),
            (alice, eve), (eve, alice),
            (bob, dave), (dave, bob),
        ]:
            db.add(Contact(owner_id=owner.id, contact_user_id=contact_user.id))

        # --- DM: alice ↔ bob ---
        dm_ab = Conversation(
            type=ConversationType.direct, created_by=alice.id,
            last_message_at=NOW - timedelta(minutes=5),
        )
        db.add(dm_ab)
        await db.flush()
        for uid, role in [(alice.id, MemberRole.admin), (bob.id, MemberRole.member)]:
            db.add(ConversationMember(conversation_id=dm_ab.id, user_id=uid, role=role))

        msgs_ab = [
            Message(conversation_id=dm_ab.id, sender_id=alice.id,
                    content="Hey Bob, how's it going?", created_at=NOW - timedelta(hours=2)),
            Message(conversation_id=dm_ab.id, sender_id=bob.id,
                    content="Pretty good! Just finished the new feature.", created_at=NOW - timedelta(hours=1, minutes=50)),
            Message(conversation_id=dm_ab.id, sender_id=alice.id,
                    content="Nice! Can you share the details?", created_at=NOW - timedelta(hours=1, minutes=45)),
            Message(conversation_id=dm_ab.id, sender_id=bob.id,
                    content="Sure, I'll send over the docs shortly.", created_at=NOW - timedelta(hours=1, minutes=30)),
            Message(conversation_id=dm_ab.id, sender_id=alice.id,
                    content="Sounds good 👍", created_at=NOW - timedelta(minutes=5)),
        ]
        for m in msgs_ab:
            db.add(m)
        await db.flush()
        for m in msgs_ab:
            recipient = bob if m.sender_id == alice.id else alice
            db.add(MessageReceipt(
                message_id=m.id, user_id=recipient.id, status=ReceiptStatus.read
            ))

        # --- DM: alice ↔ carol (last message unread by alice) ---
        dm_ac = Conversation(
            type=ConversationType.direct, created_by=alice.id,
            last_message_at=NOW - timedelta(hours=1),
        )
        db.add(dm_ac)
        await db.flush()
        for uid, role in [(alice.id, MemberRole.admin), (carol.id, MemberRole.member)]:
            db.add(ConversationMember(conversation_id=dm_ac.id, user_id=uid, role=role))

        msgs_ac = [
            Message(conversation_id=dm_ac.id, sender_id=carol.id,
                    content="Are you free for lunch tomorrow?", created_at=NOW - timedelta(hours=3)),
            Message(conversation_id=dm_ac.id, sender_id=alice.id,
                    content="Yes! Where are you thinking?", created_at=NOW - timedelta(hours=2, minutes=55)),
            Message(conversation_id=dm_ac.id, sender_id=carol.id,
                    content="Maybe the Italian place on 5th?", created_at=NOW - timedelta(hours=1)),
        ]
        for m in msgs_ac:
            db.add(m)
        await db.flush()
        db.add(MessageReceipt(message_id=msgs_ac[0].id, user_id=alice.id, status=ReceiptStatus.read))
        db.add(MessageReceipt(message_id=msgs_ac[1].id, user_id=carol.id, status=ReceiptStatus.read))
        db.add(MessageReceipt(message_id=msgs_ac[2].id, user_id=alice.id, status=ReceiptStatus.delivered))

        # --- DM: bob ↔ dave ---
        dm_bd = Conversation(
            type=ConversationType.direct, created_by=bob.id,
            last_message_at=NOW - timedelta(days=1),
        )
        db.add(dm_bd)
        await db.flush()
        for uid, role in [(bob.id, MemberRole.admin), (dave.id, MemberRole.member)]:
            db.add(ConversationMember(conversation_id=dm_bd.id, user_id=uid, role=role))

        msgs_bd = [
            Message(conversation_id=dm_bd.id, sender_id=bob.id,
                    content="Did you see the game last night?", created_at=NOW - timedelta(days=1, hours=2)),
            Message(conversation_id=dm_bd.id, sender_id=dave.id,
                    content="Yeah! Unbelievable finish 🏈", created_at=NOW - timedelta(days=1, hours=1)),
            Message(conversation_id=dm_bd.id, sender_id=bob.id,
                    content="Best game of the season", created_at=NOW - timedelta(days=1)),
        ]
        for m in msgs_bd:
            db.add(m)
        await db.flush()
        for m in msgs_bd:
            recipient = dave if m.sender_id == bob.id else bob
            db.add(MessageReceipt(message_id=m.id, user_id=recipient.id, status=ReceiptStatus.read))

        # --- Group: Team Alpha (alice admin, bob, carol, dave) ---
        grp1 = Conversation(
            type=ConversationType.group, name="Team Alpha", created_by=alice.id,
            last_message_at=NOW - timedelta(minutes=30),
        )
        db.add(grp1)
        await db.flush()
        for uid, role in [
            (alice.id, MemberRole.admin), (bob.id, MemberRole.member),
            (carol.id, MemberRole.member), (dave.id, MemberRole.member),
        ]:
            db.add(ConversationMember(conversation_id=grp1.id, user_id=uid, role=role))

        db.add(Message(
            conversation_id=grp1.id, sender_id=alice.id,
            content="Alice added Dave to the group",
            type=MessageType.system, created_at=NOW - timedelta(hours=5),
        ))
        await db.flush()

        msgs_g1 = [
            Message(conversation_id=grp1.id, sender_id=alice.id,
                    content="Welcome to Team Alpha everyone!", created_at=NOW - timedelta(hours=4)),
            Message(conversation_id=grp1.id, sender_id=bob.id,
                    content="Glad to be here 🎉", created_at=NOW - timedelta(hours=3, minutes=50)),
            Message(conversation_id=grp1.id, sender_id=carol.id,
                    content="Same! When's the first meeting?", created_at=NOW - timedelta(hours=3, minutes=40)),
            Message(conversation_id=grp1.id, sender_id=alice.id,
                    content="Tomorrow at 10am", created_at=NOW - timedelta(hours=3, minutes=30)),
            Message(conversation_id=grp1.id, sender_id=dave.id,
                    content="Works for me 👍", created_at=NOW - timedelta(minutes=30)),
        ]
        for m in msgs_g1:
            db.add(m)
        await db.flush()

        db.add(MessageReaction(message_id=msgs_g1[0].id, user_id=bob.id, emoji="👍"))
        db.add(MessageReaction(message_id=msgs_g1[0].id, user_id=carol.id, emoji="❤️"))

        # --- Group: Weekend Plans (eve admin, alice, frank, grace) ---
        grp2 = Conversation(
            type=ConversationType.group, name="Weekend Plans", created_by=eve.id,
            last_message_at=NOW - timedelta(hours=2),
        )
        db.add(grp2)
        await db.flush()
        for uid, role in [
            (eve.id, MemberRole.admin), (alice.id, MemberRole.member),
            (frank.id, MemberRole.member), (grace.id, MemberRole.member),
        ]:
            db.add(ConversationMember(conversation_id=grp2.id, user_id=uid, role=role))

        msgs_g2 = [
            Message(conversation_id=grp2.id, sender_id=eve.id,
                    content="Anyone up for hiking Saturday?", created_at=NOW - timedelta(hours=4)),
            Message(conversation_id=grp2.id, sender_id=frank.id,
                    content="I'm in!", created_at=NOW - timedelta(hours=3)),
            Message(conversation_id=grp2.id, sender_id=grace.id,
                    content="Me too, what trail?", created_at=NOW - timedelta(hours=2, minutes=30)),
            Message(conversation_id=grp2.id, sender_id=eve.id,
                    content="Pine Ridge — 8 miles. Meet at trailhead at 8am.", created_at=NOW - timedelta(hours=2)),
        ]
        for m in msgs_g2:
            db.add(m)

        await db.commit()
        print("✅ Seed complete: 8 users, contacts, 3 DMs, 2 groups")


if __name__ == "__main__":
    asyncio.run(seed())
