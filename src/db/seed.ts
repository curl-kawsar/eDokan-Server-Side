import { db } from "@/config/db";
import { users } from "@/db/schema/users";
import { customers } from "@/db/schema/customers";
import { vehicles } from "@/db/schema/vehicles";
import { suppliers } from "@/db/schema/suppliers";
import { parts } from "@/db/schema/parts";
import { hashPassword } from "@/utils/password";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding database...");

  const adminEmail = "admin@ehiseb.com";
  const existingAdmin = await db.query.users.findFirst({
    where: eq(users.email, adminEmail),
  });

  if (!existingAdmin) {
    const passwordHash = await hashPassword("admin123");
    await db.insert(users).values({
      name: "অ্যাডমিন",
      email: adminEmail,
      phone: "01700000000",
      passwordHash,
      role: "admin",
    });
    console.log(`✅ Admin user created: ${adminEmail} / admin123`);
  } else {
    console.log("ℹ️  Admin user already exists");
  }

  const customerCount = await db.$count(customers);
  if (customerCount === 0) {
    const [c1, c2, c3] = await db
      .insert(customers)
      .values([
        {
          name: "মোঃ আব্দুর রহিম",
          phone: "01712345678",
          email: "rahim@example.com",
          address: "১২৩, মিরপুর-১০, ঢাকা",
          nidNumber: "1234567890123",
        },
        {
          name: "করিম উদ্দিন",
          phone: "01898765432",
          address: "৪৫, ধানমন্ডি, ঢাকা",
        },
        {
          name: "জাহিদ হাসান",
          phone: "01611223344",
          address: "চট্টগ্রাম",
        },
      ])
      .returning();

    await db.insert(vehicles).values([
      {
        customerId: c1.id,
        type: "motorcycle",
        brand: "Bajaj",
        model: "Pulsar 150",
        registrationNo: "ঢাকা মেট্রো-হ-১২-৩৪৫৬",
        color: "কালো",
        yearOfMake: 2022,
        mileage: 15000,
      },
      {
        customerId: c2.id,
        type: "car",
        brand: "Toyota",
        model: "Corolla",
        registrationNo: "ঢাকা মেট্রো-গ-২২-১১২২",
        color: "সিলভার",
        yearOfMake: 2018,
        mileage: 65000,
      },
      {
        customerId: c3.id,
        type: "cng",
        brand: "Bajaj",
        model: "RE",
        registrationNo: "চট্ট মেট্রো-থ-১১-২২৩৩",
        color: "সবুজ",
        yearOfMake: 2020,
      },
    ]);
    console.log("✅ Sample customers and vehicles created");
  } else {
    console.log("ℹ️  Customers already exist");
  }

  const supplierCount = await db.$count(suppliers);
  if (supplierCount === 0) {
    const [s1] = await db
      .insert(suppliers)
      .values([
        {
          name: "ঢাকা অটো পার্টস",
          contactPerson: "জসিম মিয়া",
          phone: "01711111111",
          address: "বংশাল, ঢাকা",
        },
        {
          name: "চট্টগ্রাম পার্টস হাউস",
          contactPerson: "রফিক",
          phone: "01822222222",
          address: "নিউ মার্কেট, চট্টগ্রাম",
        },
      ])
      .returning();

    await db.insert(parts).values([
      {
        sku: "ENG-OIL-1L",
        name: "Engine Oil 1L",
        nameBn: "ইঞ্জিন অয়েল ১ লিটার",
        category: "lubricant",
        brand: "Mobil",
        unit: "bottle",
        purchasePrice: "550",
        sellingPrice: "750",
        stockQty: 30,
        lowStockThreshold: 5,
        supplierId: s1.id,
      },
      {
        sku: "BRK-PAD-PLR",
        name: "Brake Pad Pulsar",
        nameBn: "ব্রেক প্যাড (পালসার)",
        category: "brake",
        brand: "Bajaj",
        unit: "set",
        purchasePrice: "400",
        sellingPrice: "650",
        stockQty: 12,
        lowStockThreshold: 4,
        supplierId: s1.id,
      },
      {
        sku: "SPARK-PLG",
        name: "Spark Plug",
        nameBn: "স্পার্ক প্লাগ",
        category: "ignition",
        brand: "NGK",
        unit: "pcs",
        purchasePrice: "150",
        sellingPrice: "250",
        stockQty: 50,
        lowStockThreshold: 10,
        supplierId: s1.id,
      },
      {
        sku: "AIR-FLT",
        name: "Air Filter",
        nameBn: "এয়ার ফিল্টার",
        category: "filter",
        brand: "Generic",
        unit: "pcs",
        purchasePrice: "200",
        sellingPrice: "350",
        stockQty: 3,
        lowStockThreshold: 5,
      },
    ]);
    console.log("✅ Sample suppliers and parts created");
  } else {
    console.log("ℹ️  Suppliers already exist");
  }

  console.log("🎉 Seed complete!");
  process.exit(0);
}

seed().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});
