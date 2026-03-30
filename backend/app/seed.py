"""Seed script for permit types and checklist items.

Run with: python -m app.seed
"""
import asyncio
import uuid

from sqlalchemy import select

from app.database import async_session_maker, engine
from app.models.checklist import ChecklistItem, PermitType


PERMIT_TYPES = [
    {
        "code": "construction",
        "name_en": "Construction Permit",
        "name_ar": "رخصة بناء",
        "description_en": "Permit for new building construction within Greater Amman Municipality boundaries.",
        "description_ar": "رخصة لبناء مبنى جديد ضمن حدود أمانة عمان الكبرى.",
    },
    {
        "code": "renovation",
        "name_en": "Renovation Permit",
        "name_ar": "رخصة ترميم",
        "description_en": "Permit for renovating or modifying an existing building.",
        "description_ar": "رخصة لترميم أو تعديل مبنى قائم.",
    },
    {
        "code": "demolition",
        "name_en": "Demolition Permit",
        "name_ar": "رخصة هدم",
        "description_en": "Permit for demolishing an existing structure.",
        "description_ar": "رخصة لهدم مبنى قائم.",
    },
]

CHECKLIST_ITEMS = {
    "construction": [
        {
            "name_en": "Land Ownership Deed",
            "name_ar": "سند ملكية الأرض",
            "description_en": "Official land ownership deed (Tabu) issued by the Department of Lands and Survey.",
            "description_ar": "سند ملكية الأرض الرسمي (طابو) صادر عن دائرة الأراضي والمساحة.",
            "document_category": "ownership",
            "accepted_formats": ["pdf", "jpg", "png"],
            "is_required": True,
            "sort_order": 1,
        },
        {
            "name_en": "Site Plan",
            "name_ar": "مخطط الموقع",
            "description_en": "Approved site plan showing the plot boundaries, setbacks, and building footprint.",
            "description_ar": "مخطط الموقع المعتمد يوضح حدود القطعة والارتدادات ومساحة البناء.",
            "document_category": "engineering",
            "accepted_formats": ["pdf", "dwf", "jpg", "png"],
            "is_required": True,
            "sort_order": 2,
        },
        {
            "name_en": "Architectural Drawings",
            "name_ar": "المخططات المعمارية",
            "description_en": "Complete architectural drawings including floor plans, elevations, and sections.",
            "description_ar": "المخططات المعمارية الكاملة بما في ذلك مخططات الطوابق والواجهات والمقاطع.",
            "document_category": "engineering",
            "accepted_formats": ["pdf", "dwf"],
            "is_required": True,
            "sort_order": 3,
        },
        {
            "name_en": "Structural Drawings",
            "name_ar": "المخططات الإنشائية",
            "description_en": "Structural engineering drawings including foundation plans, column layouts, and beam details.",
            "description_ar": "المخططات الإنشائية بما في ذلك مخططات الأساسات وتوزيع الأعمدة وتفاصيل الجسور.",
            "document_category": "engineering",
            "accepted_formats": ["pdf", "dwf"],
            "is_required": True,
            "sort_order": 4,
        },
        {
            "name_en": "MEP Drawings",
            "name_ar": "مخططات الميكانيك والكهرباء والسباكة",
            "description_en": "Mechanical, Electrical, and Plumbing (MEP) drawings for all building systems.",
            "description_ar": "مخططات الأنظمة الميكانيكية والكهربائية والسباكة لجميع أنظمة المبنى.",
            "document_category": "engineering",
            "accepted_formats": ["pdf", "dwf"],
            "is_required": True,
            "sort_order": 5,
        },
        {
            "name_en": "Soil Test Report",
            "name_ar": "تقرير فحص التربة",
            "description_en": "Geotechnical soil investigation report from an accredited laboratory.",
            "description_ar": "تقرير فحص التربة الجيوتقني من مختبر معتمد.",
            "document_category": "report",
            "accepted_formats": ["pdf"],
            "is_required": True,
            "sort_order": 6,
        },
        {
            "name_en": "Engineer Syndicate Registration",
            "name_ar": "تسجيل نقابة المهندسين",
            "description_en": "Proof of registration of the supervising engineer with the Jordan Engineers Association.",
            "description_ar": "إثبات تسجيل المهندس المشرف لدى نقابة المهندسين الأردنيين.",
            "document_category": "registration",
            "accepted_formats": ["pdf", "jpg", "png"],
            "is_required": True,
            "sort_order": 7,
        },
    ],
    "renovation": [
        {
            "name_en": "Ownership Deed or Lease",
            "name_ar": "سند ملكية أو عقد إيجار",
            "description_en": "Official ownership deed or valid lease agreement for the property.",
            "description_ar": "سند ملكية رسمي أو عقد إيجار ساري المفعول للعقار.",
            "document_category": "ownership",
            "accepted_formats": ["pdf", "jpg", "png"],
            "is_required": True,
            "sort_order": 1,
        },
        {
            "name_en": "Existing Building Plans",
            "name_ar": "مخططات المبنى الحالي",
            "description_en": "As-built drawings or plans of the existing building to be renovated.",
            "description_ar": "مخططات المبنى الحالي كما هو مبني والمراد ترميمه.",
            "document_category": "engineering",
            "accepted_formats": ["pdf", "dwf", "jpg", "png"],
            "is_required": True,
            "sort_order": 2,
        },
        {
            "name_en": "Proposed Modification Drawings",
            "name_ar": "مخططات التعديلات المقترحة",
            "description_en": "Detailed drawings showing all proposed modifications and renovations.",
            "description_ar": "مخططات تفصيلية توضح جميع التعديلات والترميمات المقترحة.",
            "document_category": "engineering",
            "accepted_formats": ["pdf", "dwf"],
            "is_required": True,
            "sort_order": 3,
        },
        {
            "name_en": "Structural Assessment",
            "name_ar": "التقييم الإنشائي",
            "description_en": "Structural assessment report confirming the building can support the proposed modifications.",
            "description_ar": "تقرير التقييم الإنشائي يؤكد قدرة المبنى على تحمل التعديلات المقترحة.",
            "document_category": "report",
            "accepted_formats": ["pdf"],
            "is_required": True,
            "sort_order": 4,
        },
    ],
    "demolition": [
        {
            "name_en": "Ownership Deed",
            "name_ar": "سند الملكية",
            "description_en": "Official ownership deed for the property to be demolished.",
            "description_ar": "سند الملكية الرسمي للعقار المراد هدمه.",
            "document_category": "ownership",
            "accepted_formats": ["pdf", "jpg", "png"],
            "is_required": True,
            "sort_order": 1,
        },
        {
            "name_en": "Site Plan",
            "name_ar": "مخطط الموقع",
            "description_en": "Site plan showing the building to be demolished and surrounding structures.",
            "description_ar": "مخطط الموقع يوضح المبنى المراد هدمه والمباني المحيطة.",
            "document_category": "engineering",
            "accepted_formats": ["pdf", "dwf", "jpg", "png"],
            "is_required": True,
            "sort_order": 2,
        },
        {
            "name_en": "Demolition Method Statement",
            "name_ar": "بيان طريقة الهدم",
            "description_en": "Detailed method statement describing the demolition approach, safety measures, and timeline.",
            "description_ar": "بيان تفصيلي يصف طريقة الهدم وإجراءات السلامة والجدول الزمني.",
            "document_category": "report",
            "accepted_formats": ["pdf"],
            "is_required": True,
            "sort_order": 3,
        },
        {
            "name_en": "Neighboring Properties Assessment",
            "name_ar": "تقييم العقارات المجاورة",
            "description_en": "Assessment report on the impact of demolition on neighboring properties.",
            "description_ar": "تقرير تقييم تأثير الهدم على العقارات المجاورة.",
            "document_category": "report",
            "accepted_formats": ["pdf"],
            "is_required": True,
            "sort_order": 4,
        },
        {
            "name_en": "Utility Disconnection Confirmation",
            "name_ar": "تأكيد فصل المرافق",
            "description_en": "Confirmation letters from utility providers that all services have been disconnected.",
            "description_ar": "رسائل تأكيد من مزودي الخدمات بأن جميع المرافق قد تم فصلها.",
            "document_category": "legal",
            "accepted_formats": ["pdf", "jpg", "png"],
            "is_required": True,
            "sort_order": 5,
        },
    ],
}


async def seed_database() -> None:
    """Seed the database with permit types and their checklist items."""
    async with async_session_maker() as session:
        for pt_data in PERMIT_TYPES:
            result = await session.execute(
                select(PermitType).where(PermitType.code == pt_data["code"])
            )
            existing = result.scalar_one_or_none()

            if existing:
                print(f"Permit type '{pt_data['code']}' already exists, skipping...")
                permit_type = existing
            else:
                permit_type = PermitType(**pt_data)
                session.add(permit_type)
                await session.flush()
                print(f"Created permit type: {pt_data['name_en']} ({pt_data['name_ar']})")

            items = CHECKLIST_ITEMS.get(pt_data["code"], [])
            for item_data in items:
                result = await session.execute(
                    select(ChecklistItem).where(
                        ChecklistItem.permit_type_id == permit_type.id,
                        ChecklistItem.name_en == item_data["name_en"],
                    )
                )
                existing_item = result.scalar_one_or_none()

                if existing_item:
                    print(f"  Checklist item '{item_data['name_en']}' already exists, skipping...")
                    continue

                checklist_item = ChecklistItem(
                    permit_type_id=permit_type.id,
                    **item_data,
                )
                session.add(checklist_item)
                print(f"  Created checklist item: {item_data['name_en']} ({item_data['name_ar']})")

        await session.commit()
        print("\nSeeding completed successfully!")


if __name__ == "__main__":
    asyncio.run(seed_database())
