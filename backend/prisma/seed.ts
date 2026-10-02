import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding data...');
  
  // 0. Create Admin User
  const adminEmail = 'admin@gvserp.com';
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { password: hashedPassword },
    create: {
      email: adminEmail,
      name: 'System Admin',
      password: hashedPassword,
      role: 'ADMIN' as any,
    },
  });
  console.log('Admin user created: admin@gvserp.com / admin123');

  // 0.1 Create Staff User
  const staffEmail = 'staff@gvserp.com';
  await prisma.user.upsert({
    where: { email: staffEmail },
    update: { password: hashedPassword },
    create: {
      email: staffEmail,
      name: 'Operations Staff',
      password: hashedPassword,
      role: 'STAFF' as any,
    },
  });
  console.log('Staff user created: staff@gvserp.com / staff123');

  // 1. Create Categories
  const catPackaging = await prisma.category.upsert({
    where: { name: 'Packaging Materials' },
    update: {},
    create: { 
      name: 'Packaging Materials', 
      type: 'PACKAGING' as any 
    },
  });

  const catFood = await prisma.category.upsert({
    where: { name: 'Food Products' },
    update: {},
    create: { 
      name: 'Food Products', 
      type: 'FOOD' as any 
    },
  });

  // 2. Create Products
  const productData = [
    { name: 'Bio-Degradable Bags', sku: 'PKG-001', stock: 450000, price: 0.25, categoryId: catPackaging.id },
    { name: 'Vacuum Seal Film', sku: 'PKG-002', stock: 120000, price: 1.5, categoryId: catPackaging.id },
    { name: 'Corrugated Boxes', sku: 'PKG-003', stock: 250000, price: 0.45, categoryId: catPackaging.id },
    { name: 'Frozen Corn', sku: 'FOOD-001', stock: 5000, price: 2.5, categoryId: catFood.id },
    { name: 'Dried Oregano', sku: 'FOOD-002', stock: 2000, price: 5.0, categoryId: catFood.id },
  ];

    for (const item of productData) {
    const existing = await prisma.product.findFirst({ where: { name: item.name } });
    const data = {
      name: item.name,
      stock: item.stock,
      price: item.price,
      categoryId: item.categoryId,
    };
    if (existing) {
      await prisma.product.update({ where: { id: existing.id }, data });
    } else {
      await prisma.product.create({ data });
    }
  }

  // 3. Create Shipments
  const shipmentData = [
    { orderNumber: 'ORD-2034', clientName: 'Green Leaf Foods', destination: 'Chicago, IL', status: 'IN_TRANSIT' },
    { orderNumber: 'ORD-2035', clientName: 'Oceanic Seafood', destination: 'Miami, FL', status: 'PENDING' },
    { orderNumber: 'ORD-2036', clientName: 'Harvest Mart', destination: 'Austin, TX', status: 'DELIVERED' },
  ];

  for (const item of shipmentData) {
    await prisma.shipment.upsert({
      where: { orderNumber: item.orderNumber },
      update: {
        clientName: item.clientName,
        destination: item.destination,
        status: item.status as any,
      },
      create: {
        orderNumber: item.orderNumber,
        clientName: item.clientName,
        destination: item.destination,
        status: item.status as any,
      },
    });
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed Error:', e);
    // Removed process.exit(1) to avoid potential environment-specific type errors
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
