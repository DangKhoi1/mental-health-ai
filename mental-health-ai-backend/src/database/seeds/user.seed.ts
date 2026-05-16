import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../modules/user/entities/user.entity';
import { Role } from '../../modules/role/entities/role.entity';
import { Allcode } from '../../modules/allcode/entities/allcode.entity';

export const userSeedData = [
  {
    username: 'admin',
    email: 'admin@mentalhealth.com',
    password: '123456',
    fullName: 'Administrator',
    phoneNumber: '0901234567',
    genderCode: 'M',
    roleName: 'Admin',
  },
  {
    username: 'user1',
    email: 'user1@mentalhealth.com',
    password: '123456',
    fullName: 'Nguyễn Văn A',
    phoneNumber: '0909876543',
    genderCode: 'M',
    roleName: 'User',
  },
  {
    username: 'user2',
    email: 'user2@mentalhealth.com',
    password: '123456',
    fullName: 'Trần Thị B',
    phoneNumber: '0912345678',
    genderCode: 'F',
    roleName: 'User',
  },
];

export async function seedUsers(dataSource: DataSource): Promise<void> {
  const userRepository = dataSource.getRepository(User);
  const roleRepository = dataSource.getRepository(Role);
  const allcodeRepository = dataSource.getRepository(Allcode);

  console.log('Seeding users...');

  for (const data of userSeedData) {
    const existing = await userRepository.findOne({
      where: { username: data.username },
    });

    if (existing) {
      console.log(`Skipped (exists): ${data.username}`);
      continue;
    }

    const role = await roleRepository.findOne({
      where: { roleName: data.roleName },
    });

    if (!role) {
      console.log(
        `Role not found: ${data.roleName}, skipping user ${data.username}`,
      );
      continue;
    }

    const gender = await allcodeRepository.findOne({
      where: { keyMap: data.genderCode, type: 'GENDER' },
    });

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = userRepository.create({
      username: data.username,
      email: data.email,
      password: hashedPassword,
      fullName: data.fullName,
      phoneNumber: data.phoneNumber,
      gender: gender || undefined,
      role: role,
      isActive: true,
    });

    await userRepository.save(user);
    console.log(`Created user: ${data.username} (${data.roleName})`);
  }

  console.log('\nUser seeding completed!');
}
