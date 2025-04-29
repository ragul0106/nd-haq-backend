import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { Injectable, Inject } from '@nestjs/common';
import { Role } from 'src/role/role.schema';

@Injectable()
export class RoleSeeder {
  constructor(
    @Inject(getModelToken(Role.name))
    private readonly roleModel: Model<Role>,
  ) {}

  async seed() {
    const roles = [
      {
        Role: 'admin',
        description: 'Full access to all resources.',
        createdBy: 'system',
        updatedBy: 'system',
      },
      {
        Role: 'attestor',
        description: 'Can edit documents.',
        createdBy: 'system',
        updatedBy: 'system',
      },
      {
        Role: 'maker',
        description: 'Can insert new documents only.',
        createdBy: 'system',
        updatedBy: 'system',
      },
      {
        Role: 'schemaCreator',
        description: 'Can create schema documents only.',
        createdBy: 'system',
        updatedBy: 'system',
      },
    ];

    for (const role of roles) {
      const exists = await this.roleModel.exists({ Role: role.Role });
      if (!exists) {
        await this.roleModel.create(role);
        console.log(`✅ Inserted role: ${role.Role}`);
      } else {
        console.log(`ℹ️ Role already exists: ${role.Role}`);
      }
    }

    console.log('🎉 Role seeding completed.');
  }
}
