import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { RoleSeeder } from './role.seeder';

@Injectable()
export class SeederService implements OnApplicationBootstrap {
  constructor(private readonly roleSeeder: RoleSeeder) {}

  async onApplicationBootstrap() {
    await this.roleSeeder.seed();
  }
}
