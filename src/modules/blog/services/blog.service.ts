import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Scope,
} from "@nestjs/common";
import { CreateBlogDto, UpdateBlogDto } from "../dto/blog.dto";
import { FindOptionsRelations, FindOptionsSelect, Repository } from "typeorm";
import { Blog } from "../entities/blog.entity";
import { ShopService } from "../../shop/services/shop.service";
import { REQUEST } from "@nestjs/core";
import { Request } from "express";
import { CategoryService } from "../../category/category.service";
import { InjectRepository } from "@nestjs/typeorm";
import { createSlug, randomId } from "utility/function.util";
import { S3Service } from "src/modules/s3/s3.service";
import { isArray } from "class-validator";
import { BlogCategory } from "../entities/blog-category.entity";
import { Shop } from "src/modules/shop/entities/shop.entity";
import { paginationDto } from "src/common/dtos/pagination.dto";
import {
  paginationGenerator,
  paginationResolver,
} from "utility/pagination.util";

@Injectable({ scope: Scope.REQUEST })
export class BlogService {
  constructor(
    @InjectRepository(Blog)
    private blogRepository: Repository<Blog>,
    @InjectRepository(BlogCategory)
    private blogCategoryRepository: Repository<BlogCategory>,
    private s3Service: S3Service,
    private readonly shopService: ShopService,
    private readonly categoryService: CategoryService,
    @Inject(REQUEST) private request: Request
  ) {}

  /**
   * Creates a new blog post with image upload and category associations
   *
   * @param createBlogDto - Data Transfer Object containing blog metadata and content
   * @param image - Uploaded image file via Multer middleware
   * @param shopId - Optional ID for shop association (for shop-specific blogs)
   * @returns Success message object
   * @throws BadRequestException - For:
   * - Invalid categories format
   * - Non-numeric category IDs
   * - Slug generation failures
   * @throws NotFoundException - If:
   * - Associated shop not found
   * - Shop category not found
   * @throws ConflictException - If generated slug already exists
   */
  async create(
    createBlogDto: CreateBlogDto,
    image: Express.Multer.File,
    shopId?: number
  ) {
    const user = this.request["user"];
    let shop: Shop | null = null;
    if (shopId) {
      shop = await this.shopService.findOneById(shopId);
    }

    let { title, content, description, categories, slug, status } =
      createBlogDto;

    if (!isArray(categories) && typeof categories === "string") {
      categories = categories.split(",");
    } else if (!isArray(categories)) {
      throw new BadRequestException("Enter the categories correctly.");
    }
    const { Location, Key } = await this.s3Service.uploadFile(
      image[0],
      "blog_image"
    );

    let slugData = slug ?? title;
    slug = createSlug(slugData);
    const isSlugExist = await this.checkBlogBySlug(slug);
    if (isSlugExist) {
      slug = slug + `${randomId()}`;
    }

    //* Create and persist blog entity
    let blog = this.blogRepository.create({
      title,
      slug,
      content,
      description,
      shopId: shopId ?? null,
      status,
      image: Location,
      imageKey: Key,
      authorId: user.id,
    });
    blog = await this.blogRepository.save(blog);

    let allowedCategories: number[] | null = null;
    if (shop) {
      const shopCategory = await this.categoryService.findOne(
        shop.categoryId,
        true
      );

      allowedCategories = shopCategory.subcategories.reduce(
        (acc, sub) => [...acc, sub.id],
        [shopCategory.id]
      );
    }
    await this.validateAndInsertCategories(
      blog.id,
      categories,
      allowedCategories
    );

    return {
      message: "blog created successfully.",
    };
  }

  async checkBlogBySlug(slug: string) {
    const blog = await this.blogRepository.findOneBy({ slug });
    return blog;
  }

  /**
   * Defines the selection relations for the Blog entity used in database queries.
   * - TODO: Extend the selection to include the `author` relation, specifically the `username` property.
   */
  private readonly blogSelectRelations: FindOptionsSelect<Blog> = {
    shop: {
      id: true,
      name: true,
    },
    categories: {
      id: true,
      category: {
        id: true,
        name: true,
        image: true,
      },
    },
    //TODO: add author username to select
    // author: {},
  };
  private readonly blogRelations: FindOptionsRelations<Blog> = {
    shop: true,
    categories: {
      category: true,
    },
    // author: true,
  };

  async findOneBySlug(slug: string) {
    if (slug.trim() === "") {
      throw new BadRequestException("slug is empty");
    }
    const blog = await this.blogRepository.find({
      where: { slug: slug },
      relations: this.blogRelations,
      select: this.blogSelectRelations,
    });
    if (!blog) {
      throw new NotFoundException("blog not found");
    }
    return blog;
  }

  async findOneById(blogId: number) {
    const blog = await this.blogRepository.find({
      where: { id: blogId },
      relations: this.blogRelations,
      select: this.blogSelectRelations,
    });
    if (!blog) {
      throw new NotFoundException("blog not found");
    }
    return blog;
  }

  async findAll(paginationDto: paginationDto) {
    const { page, limit, skip } = paginationResolver(
      paginationDto.page,
      paginationDto.limit
    );
    const [blogs, count] = await this.blogRepository.findAndCount({
      where: {},
      relations: this.blogRelations,
      select: {
        id: true,
        title: true,
        description: true,
        updatedAt: true,
        authorId: true,
        slug: true,
        image: true,
        content: false,
        ...this.blogSelectRelations,
      },

      skip,
      take: limit,
      order: { id: "DESC" },
    });
    return { pagination: paginationGenerator(count, page, limit), blogs };
  }

  /**
   * Soft deletes a blog and its associated categories by setting the `deletedAt` timestamp.
   *
   * @param blogId - The ID of the blog to be soft deleted.
   * @throws {NotFoundException} If the blog with the given ID is not found.
   * @returns An object containing a success message.
   */
  async softDelete(blogId: number, shopId: number) {
    const blog = await this.blogRepository.findOneBy({ id: blogId });
    if (!blog) {
      throw new NotFoundException(`Blog not found`);
    }
    if (blog.shopId !== shopId) {
      throw new ForbiddenException(`You are not allowed to delete this blog`);
    }
    const now = new Date();
    blog.deletedAt = now;

    // Update deletedAt for associated categories
    const blogCategories = await this.blogCategoryRepository.find({
      where: { blogId },
    });

    for (const blogCategory of blogCategories) {
      blogCategory.deletedAt = now;
    }

    await this.blogCategoryRepository.save(blogCategories);
    await this.blogRepository.save(blog);

    return { message: `Blog deleted successfully` };
  }

  /**
   * Updates an existing blog post with new data, including optional image and category updates.
   *
   * @param blogId - The ID of the blog to update.
   * @param updateBlogDto - Data Transfer Object containing updated blog metadata and content.
   * @param image - Optional uploaded image file via Multer middleware.
   * @param shopId - Optional ID for shop association (for shop-specific blogs).
   * @returns Success message object.
   * @throws NotFoundException - If the blog with the given ID is not found.
   * @throws ForbiddenException - If the user is not allowed to update the blog.
   * @throws BadRequestException - For invalid categories format or non-numeric category IDs.
   */
  async update(
    blogId: number,
    updateBlogDto: UpdateBlogDto,
    image?: Express.Multer.File,
    shopId?: number
  ) {
    const user = this.request["user"];
    const blog = await this.blogRepository.findOneBy({ id: blogId });

    if (!blog) {
      throw new NotFoundException(`Blog not found`);
    }
    let shop: Shop | null = null;
    if (shopId) {
      shop = await this.shopService.findOneById(shopId);
    }
    if (shopId && blog.shopId !== shopId) {
      throw new ForbiddenException(`You are not allowed to update this blog`);
    }

    let { title, content, description, slug, status, categories } =
      updateBlogDto;

    if (title) blog.title = title;
    if (content) blog.content = content;
    if (description) blog.description = description;
    if (status) blog.status = status;

    // Handle image update
    if (image && image[0]) {
      // Delete the old image from S3 if it exists
      if (blog.imageKey) {
        await this.s3Service.deleteFile(blog.imageKey);
      }

      const { Location, Key } = await this.s3Service.uploadFile(
        image[0],
        "blog_image"
      );
      blog.image = Location;
      blog.imageKey = Key;
    }

    // Handle slug
    if (slug || title) {
      const slugBase = slug ?? title;
      const generatedSlug = createSlug(slugBase);

      const exists = await this.checkBlogBySlug(generatedSlug);
      if (exists && exists.id !== blogId) {
        slug = generatedSlug + randomId();
      } else {
        slug = generatedSlug;
      }

      blog.slug = slug;
    }
    // Handle category update
    if (categories) {
      if (!isArray(categories) && typeof categories === "string") {
        categories = categories.split(",");
      } else if (!isArray(categories)) {
        throw new BadRequestException("Enter the categories correctly.");
      }
      // Delete previous categories
      await this.blogCategoryRepository.delete({ blogId: blog.id });

      let allowedCategories: number[] | null = null;
      if (shop) {
        const shopCategory = await this.categoryService.findOne(
          shop.categoryId,
          true
        );
        console.log(shopCategory);
        allowedCategories = shopCategory.subcategories.reduce(
          (acc, sub) => [...acc, sub.id],
          [shopCategory.id]
        );
      }

      await this.validateAndInsertCategories(
        blog.id,
        categories,
        allowedCategories
      );
    }
    blog.authorId = user.id;
    await this.blogRepository.save(blog);

    return {
      message: "Blog updated successfully.",
    };
  }

  /**
   * Validates and inserts categories for a blog post.
   *
   * @param blogId - The ID of the blog post to associate the categories with.
   * @param categories - An array of category IDs (as numbers or strings) to be validated and inserted.
   * @param allowedCategories - An optional array of allowed category IDs. If provided, only these IDs are permitted.
   * @throws {BadRequestException} If a category ID is invalid or not allowed.
   * @throws {BadRequestException} If a category ID does not exist in the database.
   * @returns A Promise that resolves when all categories have been validated and inserted.
   */
  private async validateAndInsertCategories(
    blogId: number,
    categories: (number | string)[],
    allowedCategories?: number[] | null
  ) {
    for (let categoryId of categories) {
      const id = parseInt(categoryId.toString());

      if (isNaN(id)) {
        throw new BadRequestException(`Invalid category ID: ${categoryId}`);
      }

      if (allowedCategories && !allowedCategories.includes(id)) {
        throw new BadRequestException(
          `Category ID ${id} is not allowed for this shop`
        );
      }

      const category = await this.categoryService.findOne(id);

      await this.blogCategoryRepository.insert({
        blogId,
        categoryId: category.id,
      });
    }
  }
}
