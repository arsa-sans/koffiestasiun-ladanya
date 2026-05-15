// src/db/seed.ts
// Run: bun run src/db/seed.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  categories, kitchenStations, diningTables,
  products, ingredients, recipes,
  modifierGroups, modifierOptions, modifierRecipes, productModifierGroups,
} from "./schema";

const client = postgres(process.env.DATABASE_URL!, { prepare: false });
const db = drizzle(client);

async function seed() {
  console.log("🌱 Seeding Koffie Station × Ladanya POS...\n");

  // ====== KITCHEN STATIONS ======
  console.log("📍 Seeding kitchen stations...");
  const [barStation, kitchenStation, sushiStation] = await db.insert(kitchenStations).values([
    { name: "Coffee Bar", type: "bar", description: "Semua minuman kopi dan non-kopi" },
    { name: "Hot Kitchen", type: "kitchen", description: "Masakan panas dan makanan utama" },
    { name: "Sushi Station", type: "sushi", description: "Sushi, sashimi, dan makanan Jepang dingin" },
  ]).returning();

  // ====== DINING TABLES ======
  console.log("🪑 Seeding dining tables (A01–D05)...");
  const tableData = [];
  for (const section of ["A", "B", "C", "D"]) {
    for (let num = 1; num <= 5; num++) {
      const code = `${section}0${num}`;
      tableData.push({ code, name: `Meja ${code}`, capacity: section === "A" ? 6 : section === "B" ? 4 : section === "C" ? 2 : 8 });
    }
  }
  await db.insert(diningTables).values(tableData);

  // ====== CATEGORIES ======
  console.log("📂 Seeding categories...");
  const [coffeeCat, nonCoffeeCat, japaneseCat, dessertCat, snackCat] = await db.insert(categories).values([
    { name: "Coffee", slug: "coffee", description: "Kopi berkualitas tinggi", sortOrder: 1 },
    { name: "Non-Coffee", slug: "non-coffee", description: "Minuman non-kopi", sortOrder: 2 },
    { name: "Japanese Food", slug: "japanese-food", description: "Masakan Jepang autentik", sortOrder: 3 },
    { name: "Dessert", slug: "dessert", description: "Dessert dan kue", sortOrder: 4 },
    { name: "Snack", slug: "snack", description: "Camilan dan makanan ringan", sortOrder: 5 },
  ]).returning();

  // ====== INGREDIENTS ======
  console.log("🧂 Seeding ingredients...");
  const [
    coffeeBeans, milk, espresso, matchaPowder, chocolate, sugar,
    bobaJelly, creamCheese, chickenThigh, rice, ramen, soySauce,
    salmon, nori, avocado, cucumber, sesameOil, mayo,
    flour, butter, eggs, cocoa, strawberry,
  ] = await db.insert(ingredients).values([
    { name: "Coffee Beans", unit: "gr", stock: "5000", minStock: "500", costPerUnit: "150" },
    { name: "Fresh Milk", unit: "ml", stock: "10000", minStock: "1000", costPerUnit: "8" },
    { name: "Espresso Shot", unit: "ml", stock: "3000", minStock: "300", costPerUnit: "25" },
    { name: "Matcha Powder", unit: "gr", stock: "2000", minStock: "200", costPerUnit: "500" },
    { name: "Chocolate Powder", unit: "gr", stock: "3000", minStock: "300", costPerUnit: "120" },
    { name: "Sugar Syrup", unit: "ml", stock: "5000", minStock: "500", costPerUnit: "12" },
    { name: "Boba Tapioca", unit: "gr", stock: "3000", minStock: "300", costPerUnit: "80" },
    { name: "Cream Cheese", unit: "gr", stock: "2000", minStock: "200", costPerUnit: "200" },
    { name: "Chicken Thigh", unit: "gr", stock: "5000", minStock: "500", costPerUnit: "60" },
    { name: "Japanese Rice", unit: "gr", stock: "10000", minStock: "1000", costPerUnit: "20" },
    { name: "Ramen Noodle", unit: "gr", stock: "5000", minStock: "500", costPerUnit: "30" },
    { name: "Soy Sauce", unit: "ml", stock: "3000", minStock: "300", costPerUnit: "15" },
    { name: "Salmon Fillet", unit: "gr", stock: "3000", minStock: "300", costPerUnit: "350" },
    { name: "Nori Sheet", unit: "pcs", stock: "200", minStock: "20", costPerUnit: "1500" },
    { name: "Avocado", unit: "gr", stock: "2000", minStock: "200", costPerUnit: "100" },
    { name: "Cucumber", unit: "gr", stock: "2000", minStock: "200", costPerUnit: "15" },
    { name: "Sesame Oil", unit: "ml", stock: "1000", minStock: "100", costPerUnit: "80" },
    { name: "Japanese Mayo", unit: "gr", stock: "2000", minStock: "200", costPerUnit: "60" },
    { name: "All-Purpose Flour", unit: "gr", stock: "5000", minStock: "500", costPerUnit: "12" },
    { name: "Unsalted Butter", unit: "gr", stock: "3000", minStock: "300", costPerUnit: "150" },
    { name: "Eggs", unit: "pcs", stock: "100", minStock: "20", costPerUnit: "2500" },
    { name: "Cocoa Powder", unit: "gr", stock: "2000", minStock: "200", costPerUnit: "180" },
    { name: "Strawberry", unit: "gr", stock: "2000", minStock: "200", costPerUnit: "120" },
  ]).returning();

  // ====== PRODUCTS ======
  console.log("☕ Seeding products...");
  const [
    americano, latteProd, matchaLatte, cappuccino, coldBrew,
    chocolateCake, matchaFrappe, nonCoffeeTea,
    chickenKatsu, salmonDon, rameniProd, edamame,
    ichigoDaifuku, matchaRollCake,
    friesProd,
  ] = await db.insert(products).values([
    // Coffee
    { categoryId: coffeeCat.id, stationId: barStation.id, name: "Americano", description: "Espresso dengan air panas", price: "28000", sortOrder: 1 },
    { categoryId: coffeeCat.id, stationId: barStation.id, name: "Caffe Latte", description: "Espresso dengan susu steamed", price: "35000", sortOrder: 2 },
    { categoryId: coffeeCat.id, stationId: barStation.id, name: "Matcha Latte", description: "Matcha Jepang berkualitas tinggi dengan susu", price: "40000", sortOrder: 3 },
    { categoryId: coffeeCat.id, stationId: barStation.id, name: "Cappuccino", description: "Espresso, susu steamed, dan foam", price: "35000", sortOrder: 4 },
    { categoryId: coffeeCat.id, stationId: barStation.id, name: "Cold Brew", description: "Kopi seduh dingin 12 jam", price: "38000", sortOrder: 5 },
    // Non-Coffee
    { categoryId: nonCoffeeCat.id, stationId: barStation.id, name: "Chocolate Frappe", description: "Blended chocolate dengan whip cream", price: "40000", sortOrder: 6 },
    { categoryId: nonCoffeeCat.id, stationId: barStation.id, name: "Matcha Frappe", description: "Blended matcha dengan milk foam", price: "42000", sortOrder: 7 },
    { categoryId: nonCoffeeCat.id, stationId: barStation.id, name: "Jasmine Green Tea", description: "Teh hijau Jepang dengan melati", price: "30000", sortOrder: 8 },
    // Japanese Food
    { categoryId: japaneseCat.id, stationId: kitchenStation.id, name: "Chicken Katsu Curry", description: "Katsu ayam dengan kari Jepang dan nasi", price: "65000", sortOrder: 9 },
    { categoryId: japaneseCat.id, stationId: sushiStation.id, name: "Salmon Don", description: "Salmon segar di atas nasi Jepang", price: "75000", sortOrder: 10 },
    { categoryId: japaneseCat.id, stationId: kitchenStation.id, name: "Tonkotsu Ramen", description: "Ramen kaldu babi dengan telur", price: "68000", sortOrder: 11 },
    { categoryId: japaneseCat.id, stationId: kitchenStation.id, name: "Edamame", description: "Kedelai rebus dengan garam Himalaya", price: "25000", sortOrder: 12 },
    // Dessert
    { categoryId: dessertCat.id, stationId: kitchenStation.id, name: "Ichigo Daifuku", description: "Mochi strawberry isian krim", price: "35000", sortOrder: 13 },
    { categoryId: dessertCat.id, stationId: kitchenStation.id, name: "Matcha Roll Cake", description: "Roll cake matcha dengan krim", price: "45000", sortOrder: 14 },
    // Snack
    { categoryId: snackCat.id, stationId: kitchenStation.id, name: "Truffle Fries", description: "French fries dengan truffle oil", price: "38000", sortOrder: 15 },
  ]).returning();

  // ====== RECIPES ======
  console.log("📋 Seeding recipes (ingredient links)...");
  await db.insert(recipes).values([
    // Americano: 18gr beans + 150ml water(no ingredient) 
    { productId: americano.id, ingredientId: coffeeBeans.id, quantity: "18" },
    // Caffe Latte: 18gr beans + 150ml milk
    { productId: latteProd.id, ingredientId: coffeeBeans.id, quantity: "18" },
    { productId: latteProd.id, ingredientId: milk.id, quantity: "150" },
    // Matcha Latte: 15gr matcha + 150ml milk
    { productId: matchaLatte.id, ingredientId: matchaPowder.id, quantity: "15" },
    { productId: matchaLatte.id, ingredientId: milk.id, quantity: "150" },
    // Cappuccino: 18gr beans + 100ml milk
    { productId: cappuccino.id, ingredientId: coffeeBeans.id, quantity: "18" },
    { productId: cappuccino.id, ingredientId: milk.id, quantity: "100" },
    // Cold Brew: 30gr beans
    { productId: coldBrew.id, ingredientId: coffeeBeans.id, quantity: "30" },
    // Chocolate Frappe: 25gr chocolate + 200ml milk
    { productId: chocolateCake.id, ingredientId: chocolate.id, quantity: "25" },
    { productId: chocolateCake.id, ingredientId: milk.id, quantity: "200" },
    // Matcha Frappe: 20gr matcha + 150ml milk
    { productId: matchaFrappe.id, ingredientId: matchaPowder.id, quantity: "20" },
    { productId: matchaFrappe.id, ingredientId: milk.id, quantity: "150" },
    // Chicken Katsu: 200gr chicken + 200gr rice + 50gr flour + 1 egg
    { productId: chickenKatsu.id, ingredientId: chickenThigh.id, quantity: "200" },
    { productId: chickenKatsu.id, ingredientId: rice.id, quantity: "200" },
    { productId: chickenKatsu.id, ingredientId: flour.id, quantity: "50" },
    { productId: chickenKatsu.id, ingredientId: eggs.id, quantity: "1" },
    // Salmon Don: 150gr salmon + 200gr rice + 10ml soy + 5ml sesame
    { productId: salmonDon.id, ingredientId: salmon.id, quantity: "150" },
    { productId: salmonDon.id, ingredientId: rice.id, quantity: "200" },
    { productId: salmonDon.id, ingredientId: soySauce.id, quantity: "10" },
    { productId: salmonDon.id, ingredientId: sesameOil.id, quantity: "5" },
    // Ramen: 150gr noodle + 200ml soy + 50gr chashu(chicken)
    { productId: rameniProd.id, ingredientId: ramen.id, quantity: "150" },
    { productId: rameniProd.id, ingredientId: soySauce.id, quantity: "30" },
    { productId: rameniProd.id, ingredientId: eggs.id, quantity: "1" },
  ]);

  // ====== MODIFIER GROUPS ======
  console.log("🎛️ Seeding modifier groups...");
  const [sizeGroup, sugarGroup, toppingGroup, temperatureGroup, extraGroup] = await db.insert(modifierGroups).values([
    { name: "Ukuran", isRequired: true, isMultiple: false, minSelect: 1, maxSelect: 1, sortOrder: 1 },
    { name: "Level Gula", isRequired: false, isMultiple: false, minSelect: 0, maxSelect: 1, sortOrder: 2 },
    { name: "Topping", isRequired: false, isMultiple: true, minSelect: 0, maxSelect: 3, sortOrder: 3 },
    { name: "Suhu", isRequired: false, isMultiple: false, minSelect: 0, maxSelect: 1, sortOrder: 4 },
    { name: "Extra", isRequired: false, isMultiple: true, minSelect: 0, maxSelect: 2, sortOrder: 5 },
  ]).returning();

  // ====== MODIFIER OPTIONS ======
  console.log("🔘 Seeding modifier options...");
  const [sizeRegular, sizeLarge] = await db.insert(modifierOptions).values([
    // Size
    { groupId: sizeGroup.id, name: "Regular (M)", price: "0", sortOrder: 1 },
    { groupId: sizeGroup.id, name: "Large (L)", price: "8000", sortOrder: 2 },
    // Sugar
    { groupId: sugarGroup.id, name: "Tanpa Gula", price: "0", sortOrder: 1 },
    { groupId: sugarGroup.id, name: "Gula 25%", price: "0", sortOrder: 2 },
    { groupId: sugarGroup.id, name: "Gula 50%", price: "0", sortOrder: 3 },
    { groupId: sugarGroup.id, name: "Gula Normal", price: "0", sortOrder: 4 },
    // Toppings
    { groupId: toppingGroup.id, name: "Boba", price: "8000", sortOrder: 1 },
    { groupId: toppingGroup.id, name: "Grass Jelly", price: "5000", sortOrder: 2 },
    { groupId: toppingGroup.id, name: "Pudding", price: "5000", sortOrder: 3 },
    { groupId: toppingGroup.id, name: "Cream Cheese", price: "10000", sortOrder: 4 },
    // Temperature
    { groupId: temperatureGroup.id, name: "Hot", price: "0", sortOrder: 1 },
    { groupId: temperatureGroup.id, name: "Iced", price: "5000", sortOrder: 2 },
    // Extra
    { groupId: extraGroup.id, name: "Extra Shot", price: "8000", sortOrder: 1 },
    { groupId: extraGroup.id, name: "Extra Milk", price: "5000", sortOrder: 2 },
  ]).returning();

  const bobaOption = await db.select().from(modifierOptions).then((opts) => opts.find((o) => o.name === "Boba")!);
  const extraShotOption = await db.select().from(modifierOptions).then((opts) => opts.find((o) => o.name === "Extra Shot")!);

  // ====== MODIFIER RECIPES ======
  console.log("🧪 Seeding modifier recipes...");
  await db.insert(modifierRecipes).values([
    // Boba: 30gr boba
    { modifierOptionId: bobaOption.id, ingredientId: bobaJelly.id, quantity: "30" },
    // Extra Shot: 10gr beans
    { modifierOptionId: extraShotOption.id, ingredientId: coffeeBeans.id, quantity: "10" },
  ]);

  // ====== PRODUCT MODIFIER GROUPS ======
  console.log("🔗 Linking products to modifier groups...");
  const coffeeProducts = [americano.id, latteProd.id, matchaLatte.id, cappuccino.id, coldBrew.id, matchaFrappe.id, chocolateCake.id, nonCoffeeTea.id];
  
  for (const productId of coffeeProducts) {
    await db.insert(productModifierGroups).values([
      { productId, modifierGroupId: sizeGroup.id, sortOrder: 1 },
      { productId, modifierGroupId: sugarGroup.id, sortOrder: 2 },
      { productId, modifierGroupId: toppingGroup.id, sortOrder: 3 },
      { productId, modifierGroupId: temperatureGroup.id, sortOrder: 4 },
      { productId, modifierGroupId: extraGroup.id, sortOrder: 5 },
    ]);
  }

  console.log("\n✅ Seed completed successfully!");
  console.log(`   ✓ 3 kitchen stations`);
  console.log(`   ✓ 20 dining tables (A01–D05)`);
  console.log(`   ✓ 5 categories`);
  console.log(`   ✓ 23 ingredients`);
  console.log(`   ✓ 15 products`);
  console.log(`   ✓ 5 modifier groups + 14 options`);
  console.log(`   ✓ Recipes & modifier recipes linked`);
  console.log(`\n🎉 Koffie Station × Ladanya POS is ready!`);

  await client.end();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
