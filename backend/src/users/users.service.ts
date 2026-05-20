import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByName(name: string) {
    return this.prisma.user.findFirst({
      where: { name: { equals: name.trim(), mode: 'insensitive' } },
    });
  }

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.findByName(createUserDto.name);
    if (existingUser) {
      throw new ConflictException('A staff user with this name already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const permissions = createUserDto.permissions ? (createUserDto.permissions as Prisma.InputJsonValue) : Prisma.JsonNull;
    const email = createUserDto.email?.trim() || await this.generateEmailFromName(createUserDto.name);
    
    return this.prisma.user.create({
      data: {
        name: createUserDto.name.trim(),
        email,
        password: hashedPassword,
        role: createUserDto.role,
        age: createUserDto.age,
        contact: createUserDto.contact,
        address: createUserDto.address,
        permissions: permissions,
      },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        age: true,
        contact: true,
        address: true,
        permissions: true,
        createdAt: true,
      },
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const data: Prisma.UserUpdateInput = {};
    
    if (updateUserDto.name !== undefined) {
      const normalizedName = updateUserDto.name.trim();
      const existingUser = await this.findByName(normalizedName);
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('A staff user with this name already exists');
      }
      data.name = normalizedName;
    }
    if (updateUserDto.email !== undefined) data.email = updateUserDto.email;
    if (updateUserDto.role !== undefined) data.role = updateUserDto.role;
    if (updateUserDto.age !== undefined) data.age = updateUserDto.age;
    if (updateUserDto.contact !== undefined) data.contact = updateUserDto.contact;
    if (updateUserDto.address !== undefined) data.address = updateUserDto.address;
    
    if (updateUserDto.password) {
      data.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    if (updateUserDto.permissions !== undefined) {
      data.permissions = updateUserDto.permissions ? (updateUserDto.permissions as Prisma.InputJsonValue) : Prisma.JsonNull;
    }

    return this.prisma.user.update({
      where: { id },
      data: data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        age: true,
        contact: true,
        address: true,
        permissions: true,
      }
    });
  }

  async remove(id: number) {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  private async generateEmailFromName(name: string) {
    const base = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/^\.+|\.+$/g, '') || 'staff';
    let email = `${base}@gvserp.local`;
    let suffix = 1;

    while (await this.findOne(email)) {
      email = `${base}${suffix}@gvserp.local`;
      suffix += 1;
    }

    return email;
  }
}
