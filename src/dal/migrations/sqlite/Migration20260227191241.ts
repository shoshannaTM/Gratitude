import { Migration } from '@mikro-orm/migrations';

export class Migration20260227191241 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table \`gratitude_entry\` (\`id\` integer not null primary key autoincrement, \`entries\` json not null, \`entry_date\` text not null, \`created_at\` datetime not null, \`user_id\` integer not null, constraint \`gratitude_entry_user_id_foreign\` foreign key(\`user_id\`) references \`user\`(\`id\`) on delete cascade on update cascade);`);
    this.addSql(`create index \`gratitude_entry_user_id_index\` on \`gratitude_entry\` (\`user_id\`);`);

    this.addSql(`create table \`crossword_puzzle\` (\`id\` integer not null primary key autoincrement, \`week_start_date\` text not null, \`grid\` json not null, \`words\` json not null, \`keywords\` json not null, \`created_at\` datetime not null, \`user_id\` integer not null, constraint \`crossword_puzzle_user_id_foreign\` foreign key(\`user_id\`) references \`user\`(\`id\`) on delete cascade on update cascade);`);
    this.addSql(`create index \`crossword_puzzle_user_id_index\` on \`crossword_puzzle\` (\`user_id\`);`);

    this.addSql(`alter table \`user\` add column \`prompt_time\` text null default '20:00';`);
    this.addSql(`alter table \`user\` add column \`prompt_count\` integer not null default 3;`);
    this.addSql(`alter table \`user\` add column \`timezone\` text null default 'UTC';`);
  }

}
