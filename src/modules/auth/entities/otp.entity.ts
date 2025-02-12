import { BaseEntity } from "src/common/abstracts/base.entity";
import { User } from "src/modules/user/entities/user.entity";
import { Column, Entity, JoinColumn, OneToOne } from "typeorm";

@Entity()
export class Otp extends BaseEntity {
  @Column()
  code: string;
  @Column()
  userId: number;
  @OneToOne(() => User, (user) => user.otp, { onDelete: "CASCADE" })
  @JoinColumn()
  user: User;
  @Column({ type: "timestamp" })
  expiresAt: Date;
}
