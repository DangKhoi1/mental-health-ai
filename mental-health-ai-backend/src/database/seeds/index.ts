import { DataSource } from 'typeorm';
import { seedAllcode } from './allcode.seed';
import { seedAssessments } from './assessment.seed';
import { seedRoles } from './role.seed';
import { seedUsers } from './user.seed';
import { seedResources } from './resource.seed';

export async function runSeeds(dataSource: DataSource): Promise<void> {
  console.log('Starting database seeding...\n');

  await seedRoles(dataSource);
  await seedAllcode(dataSource);
  await seedUsers(dataSource);
  await seedAssessments(dataSource);
  await seedResources(dataSource);

  console.log('\nAll seeds completed successfully!');
}
