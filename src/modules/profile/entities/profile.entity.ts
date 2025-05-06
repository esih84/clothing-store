import { BeforeInsert, Column, Entity, JoinColumn, OneToOne } from "typeorm";
import { User } from "src/modules/user/entities/user.entity";
import { BaseEntity } from "src/common/abstracts/base.entity";
import { randomId } from "utility/function.util";

@Entity()
export class Profile extends BaseEntity {
  @Column()
  username: string;

  @Column({ nullable: true, type: "date" })
  birthday: Date;

  @Column({ nullable: true })
  bio: string;

  @Column({ nullable: true })
  avatar: string;
  @Column({ nullable: true })
  avatarKey: string;
  @Column()
  userId: number;

  @OneToOne(() => User, (user) => user.profile, { onDelete: "CASCADE" })
  @JoinColumn()
  user: User;

  @BeforeInsert()
  setDefaultUsername() {
    if (!this.username) {
      this.username = "user_" + randomId();
    }
  }
}
