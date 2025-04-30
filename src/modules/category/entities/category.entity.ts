import { BaseEntity } from "src/common/abstracts/base.entity";
import { BlogCategory } from "src/modules/blog/entities/blog-category.entity";
import { Shop } from "src/modules/shop/entities/shop.entity";
import { Column, Entity, ManyToOne, OneToMany } from "typeorm";

@Entity("categories")
export class Category extends BaseEntity {
  @Column({ unique: true })
  name: string;
  @Column({ unique: true })
  slug: string;
  @Column()
  image: string;
  @Column({ default: false })
  show: boolean;
  @Column()
  imageKey: string;
  @OneToMany(() => Shop, (shop) => shop.category, { onDelete: "CASCADE" })
  shops: Shop[];
  @Column({ nullable: true })
  parentId: number;
  @ManyToOne(() => Category, (category) => category.subcategories, {
    nullable: true,
    onDelete: "CASCADE",
  })
  parent: Category;

  @OneToMany(() => Category, (category) => category.parent)
  subcategories: Category[];

  @OneToMany(() => BlogCategory, (blog) => blog.category)
  blogs: BlogCategory[];
}
