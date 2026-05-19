import { Injectable } from '@nestjs/common';
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

  async create(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const permissions = createUserDto.permissions ? (createUserDto.permissions as Prisma.InputJsonValue) : Prisma.JsonNull;
    
    return this.prisma.user.create({
      data: {
        name: createUserDto.name,
        email: createUserDto.email,
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
    
    if (updateUserDto.name !== undefined) data.name = updateUserDto.name;
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
}
