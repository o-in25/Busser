-- ============================================
-- Migration: Flexible Ingredient Matching
-- Description: Adds support for matching recipe ingredients by category or base spirit
--              instead of only exact product matches.
-- Date: 2024
-- ============================================

-- ============================================
-- STEP 1: Extend the category table
-- Adds BaseSpiritId to link product categories to base spirits (whiskey, gin, vodka, etc.)
-- Adds ParentCategoryId for optional category hierarchy
-- ============================================

ALTER TABLE `app_d`.`category`
  ADD COLUMN `BaseSpiritId` INT NULL,
  ADD COLUMN `ParentCategoryId` INT NULL;

ALTER TABLE `app_d`.`category`
  ADD CONSTRAINT `fk_category_basespirit`
    FOREIGN KEY (`BaseSpiritId`) REFERENCES `app_d`.`recipecategory`(`RecipeCategoryId`),
  ADD CONSTRAINT `fk_category_parent`
    FOREIGN KEY (`ParentCategoryId`) REFERENCES `app_d`.`category`(`CategoryId`);


-- ============================================
-- STEP 2: Populate BaseSpiritId for spirit categories
-- Maps product categories to their base spirit (recipecategory)
-- ============================================

-- Whiskey (RecipeCategoryId = 4)
UPDATE `app_d`.`category` SET `BaseSpiritId` = 4
WHERE `CategoryId` IN (7, 8);  -- Bourbon Whiskey, Rye Whiskey

-- Gin (RecipeCategoryId = 5)
UPDATE `app_d`.`category` SET `BaseSpiritId` = 5
WHERE `CategoryId` IN (16, 17, 18, 19);  -- London Dry, Plymouth, Old Tom, Genever

-- Vodka (RecipeCategoryId = 6)
UPDATE `app_d`.`category` SET `BaseSpiritId` = 6
WHERE `CategoryId` IN (42, 43, 44);  -- Plain, Flavored, Infused

-- Tequila (RecipeCategoryId = 7)
UPDATE `app_d`.`category` SET `BaseSpiritId` = 7
WHERE `CategoryId` IN (45, 27);  -- Blanco, Reposado

-- Rum (RecipeCategoryId = 8)
UPDATE `app_d`.`category` SET `BaseSpiritId` = 8
WHERE `CategoryId` IN (12, 13, 14, 15, 31, 36);  -- White, Dark, Overproof, Gold, Jamaican, Rhum Agricole

-- Brandy (RecipeCategoryId = 9)
UPDATE `app_d`.`category` SET `BaseSpiritId` = 9
WHERE `CategoryId` IN (47);  -- Cognac


-- ============================================
-- STEP 3: Extend the recipestep table
-- Adds CategoryId for category-based matching
-- Adds MatchMode to control how ingredients are matched:
--   - EXACT_PRODUCT: Only the specific product (current behavior)
--   - ANY_IN_CATEGORY: Any product in the same category
--   - ANY_IN_BASE_SPIRIT: Any product with the same base spirit
-- ============================================

ALTER TABLE `app_d`.`recipestep`
  ADD COLUMN `CategoryId` INT NULL,
  ADD COLUMN `MatchMode` ENUM('EXACT_PRODUCT', 'ANY_IN_CATEGORY', 'ANY_IN_BASE_SPIRIT')
    NOT NULL DEFAULT 'EXACT_PRODUCT';

ALTER TABLE `app_d`.`recipestep`
  ADD CONSTRAINT `fk_recipestep_category`
    FOREIGN KEY (`CategoryId`) REFERENCES `app_d`.`category`(`CategoryId`);


-- ============================================
-- STEP 4: Update basicrecipestep view
-- Adds MatchMode, StepCategoryId, BaseSpiritId, and EffectiveInStock to the view
-- EffectiveInStock accounts for flexible matching based on MatchMode
-- ============================================

CREATE OR REPLACE VIEW `app_d`.`basicrecipestep` AS
SELECT
  `rs`.`RecipeId` AS `RecipeId`,
  `rs`.`RecipeStepId` AS `RecipeStepId`,
  `rs`.`RecipeStepDescription` AS `RecipeStepDescription`,
  `rs`.`MatchMode` AS `MatchMode`,
  `rs`.`CategoryId` AS `StepCategoryId`,
  `p`.`ProductName` AS `ProductName`,
  `p`.`ProductId` AS `ProductId`,
  `c`.`CategoryId` AS `CategoryId`,
  `c`.`CategoryName` AS `CategoryName`,
  `c`.`CategoryDescription` AS `CategoryDescription`,
  `c`.`BaseSpiritId` AS `BaseSpiritId`,
  `s`.`SupplierName` AS `SupplierName`,
  `s`.`SupplierDetails` AS `SupplierDetails`,
  `rs`.`ProductIdQuantityInMilliliters` AS `ProductIdQuantityInMilliliters`,
  `rs`.`ProductIdQuantityUnit` AS `ProductIdQuantityUnit`,
  `p`.`ProductInStockQuantity` AS `ProductInStockQuantity`,
  `p`.`ProductPricePerUnit` AS `ProductPricePerUnit`,
  `p`.`ProductUnitSizeInMilliliters` AS `ProductUnitSizeInMilliliters`,
  `p`.`ProductProof` AS `ProductProof`,
  `p`.`WorkspaceId` AS `WorkspaceId`,
  -- EffectiveInStock: 1 if ingredient is available considering MatchMode, 0 otherwise
  CASE
    -- EXACT_PRODUCT: only the specific product counts
    WHEN `rs`.`MatchMode` = 'EXACT_PRODUCT' THEN
      CASE WHEN `p`.`ProductInStockQuantity` > 0 THEN 1 ELSE 0 END

    -- ANY_IN_CATEGORY: any product in the same category works
    WHEN `rs`.`MatchMode` = 'ANY_IN_CATEGORY' THEN
      CASE WHEN EXISTS (
        SELECT 1 FROM `app_d`.`product` `p2`
        WHERE `p2`.`CategoryId` = `c`.`CategoryId`
        AND `p2`.`ProductInStockQuantity` > 0
        AND `p2`.`WorkspaceId` = `p`.`WorkspaceId`
      ) THEN 1 ELSE 0 END

    -- ANY_IN_BASE_SPIRIT: any product with the same base spirit works
    WHEN `rs`.`MatchMode` = 'ANY_IN_BASE_SPIRIT' THEN
      CASE WHEN EXISTS (
        SELECT 1 FROM `app_d`.`product` `p3`
        JOIN `app_d`.`category` `c3` ON `p3`.`CategoryId` = `c3`.`CategoryId`
        WHERE `c3`.`BaseSpiritId` = `c`.`BaseSpiritId`
        AND `c`.`BaseSpiritId` IS NOT NULL
        AND `p3`.`ProductInStockQuantity` > 0
        AND `p3`.`WorkspaceId` = `p`.`WorkspaceId`
      ) THEN 1 ELSE 0 END

    ELSE 0
  END AS `EffectiveInStock`
FROM `app_d`.`recipestep` `rs`
JOIN `app_d`.`product` `p` ON `rs`.`ProductId` = `p`.`ProductId`
JOIN `app_d`.`category` `c` ON `p`.`CategoryId` = `c`.`CategoryId`
JOIN `app_d`.`supplier` `s` ON `p`.`SupplierId` = `s`.`SupplierId`;


-- ============================================
-- STEP 5: Update availablerecipes view
-- Implements flexible matching logic based on MatchMode:
--   - EXACT_PRODUCT: Checks if the specific product is in stock
--   - ANY_IN_CATEGORY: Checks if any product in the category is in stock
--   - ANY_IN_BASE_SPIRIT: Checks if any product with the same base spirit is in stock
-- ============================================

CREATE OR REPLACE VIEW `app_d`.`availablerecipes` AS
SELECT
  `br`.`RecipeRecipeId` AS `RecipeRecipeId`,
  `br`.`RecipeName` AS `RecipeName`,
  `br`.`RecipeRecipeCategoryId` AS `RecipeRecipeCategoryId`,
  `br`.`RecipeRecipeDescriptionId` AS `RecipeRecipeDescriptionId`,
  `br`.`RecipeCategoryDescription` AS `RecipeCategoryDescription`,
  `br`.`RecipeCategoryCategoryId` AS `RecipeCategoryCategoryId`,
  `br`.`RecipeDescriptionId` AS `RecipeDescriptionId`,
  `br`.`RecipeDescription` AS `RecipeDescription`,
  `br`.`RecipeDescriptionImageUrl` AS `RecipeDescriptionImageUrl`,
  `br`.`RecipeStepId` AS `RecipeStepId`,
  `br`.`RecipeId` AS `RecipeId`,
  `br`.`RecipeStepProductId` AS `RecipeStepProductId`,
  `br`.`ProductIdQuantityInMilliliters` AS `ProductIdQuantityInMilliliters`,
  `br`.`ProductId` AS `ProductId`,
  `br`.`ProductCategoryId` AS `ProductCategoryId`,
  `br`.`ProductName` AS `ProductName`,
  `br`.`ProductInStockQuantity` AS `ProductInStockQuantity`,
  `br`.`ProductPricePerUnit` AS `ProductPricePerUnit`,
  `br`.`ProductUnitSizeInMilliliters` AS `ProductUnitSizeInMilliliters`,
  `br`.`ProductProof` AS `ProductProof`,
  `br`.`CategoryId` AS `CategoryId`,
  `br`.`CategoryName` AS `CategoryName`,
  `br`.`CategoryDescription` AS `CategoryDescription`,
  `br`.`WorkspaceId` AS `WorkspaceId`
FROM `app_d`.`baserecipe` `br`
WHERE `br`.`RecipeId` IN (
  SELECT `rs`.`RecipeId`
  FROM `app_d`.`recipestep` `rs`
  JOIN `app_d`.`product` `p` ON `rs`.`ProductId` = `p`.`ProductId`
  JOIN `app_d`.`category` `c` ON `p`.`CategoryId` = `c`.`CategoryId`
  GROUP BY `rs`.`RecipeId`
  HAVING SUM(
    CASE
      -- EXACT_PRODUCT: only the specific product works
      WHEN `rs`.`MatchMode` = 'EXACT_PRODUCT' THEN
        CASE WHEN `p`.`ProductInStockQuantity` > 0 THEN 1 ELSE 0 END

      -- ANY_IN_CATEGORY: any product in the same category works
      WHEN `rs`.`MatchMode` = 'ANY_IN_CATEGORY' THEN
        CASE WHEN EXISTS (
          SELECT 1 FROM `app_d`.`product` `p2`
          WHERE `p2`.`CategoryId` = COALESCE(`rs`.`CategoryId`, `p`.`CategoryId`)
          AND `p2`.`ProductInStockQuantity` > 0
          AND `p2`.`WorkspaceId` = `p`.`WorkspaceId`
        ) THEN 1 ELSE 0 END

      -- ANY_IN_BASE_SPIRIT: any product with same base spirit works
      WHEN `rs`.`MatchMode` = 'ANY_IN_BASE_SPIRIT' THEN
        CASE WHEN EXISTS (
          SELECT 1 FROM `app_d`.`product` `p3`
          JOIN `app_d`.`category` `c3` ON `p3`.`CategoryId` = `c3`.`CategoryId`
          WHERE `c3`.`BaseSpiritId` = `c`.`BaseSpiritId`
          AND `c`.`BaseSpiritId` IS NOT NULL
          AND `p3`.`ProductInStockQuantity` > 0
          AND `p3`.`WorkspaceId` = `p`.`WorkspaceId`
        ) THEN 1 ELSE 0 END

      ELSE 0
    END
  ) = COUNT(*)
);


-- ============================================
-- OPTIONAL: Backfill generic ingredients to use ANY_IN_CATEGORY
-- Uncomment and run if you want existing recipes with these ingredients
-- to automatically match any product in the category
-- ============================================

-- UPDATE `app_d`.`recipestep` `rs`
-- JOIN `app_d`.`product` `p` ON `rs`.`ProductId` = `p`.`ProductId`
-- JOIN `app_d`.`category` `c` ON `p`.`CategoryId` = `c`.`CategoryId`
-- SET `rs`.`MatchMode` = 'ANY_IN_CATEGORY',
--     `rs`.`CategoryId` = `c`.`CategoryId`
-- WHERE `c`.`CategoryName` IN (
--   'Lime Juice',
--   'Lemon Juice',
--   'Simple Syrup',
--   'Pineapple Juice',
--   'Soda Water',
--   'Ginger Beer'
-- );


-- ============================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================

-- -- Revert availablerecipes view
-- CREATE OR REPLACE VIEW `app_d`.`availablerecipes` AS
-- SELECT `br`.`RecipeRecipeId` AS `RecipeRecipeId`,`br`.`RecipeName` AS `RecipeName`,`br`.`RecipeRecipeCategoryId` AS `RecipeRecipeCategoryId`,`br`.`RecipeRecipeDescriptionId` AS `RecipeRecipeDescriptionId`,`br`.`RecipeCategoryDescription` AS `RecipeCategoryDescription`,`br`.`RecipeCategoryCategoryId` AS `RecipeCategoryCategoryId`,`br`.`RecipeDescriptionId` AS `RecipeDescriptionId`,`br`.`RecipeDescription` AS `RecipeDescription`,`br`.`RecipeDescriptionImageUrl` AS `RecipeDescriptionImageUrl`,`br`.`RecipeStepId` AS `RecipeStepId`,`br`.`RecipeId` AS `RecipeId`,`br`.`RecipeStepProductId` AS `RecipeStepProductId`,`br`.`ProductIdQuantityInMilliliters` AS `ProductIdQuantityInMilliliters`,`br`.`ProductId` AS `ProductId`,`br`.`ProductCategoryId` AS `ProductCategoryId`,`br`.`ProductName` AS `ProductName`,`br`.`ProductInStockQuantity` AS `ProductInStockQuantity`,`br`.`ProductPricePerUnit` AS `ProductPricePerUnit`,`br`.`ProductUnitSizeInMilliliters` AS `ProductUnitSizeInMilliliters`,`br`.`ProductProof` AS `ProductProof`,`br`.`CategoryId` AS `CategoryId`,`br`.`CategoryName` AS `CategoryName`,`br`.`CategoryDescription` AS `CategoryDescription`,`br`.`WorkspaceId` AS `WorkspaceId` FROM `app_d`.`baserecipe` `br` WHERE `br`.`RecipeId` IN (SELECT `rs`.`RecipeId` FROM (`app_d`.`recipestep` `rs` JOIN `app_d`.`product` `p` ON((`rs`.`ProductId` = `p`.`ProductId`))) GROUP BY `rs`.`RecipeId` HAVING (SUM((`p`.`ProductInStockQuantity` > 0)) = COUNT(0)));

-- -- Revert basicrecipestep view
-- CREATE OR REPLACE VIEW `app_d`.`basicrecipestep` AS
-- SELECT `rs`.`RecipeId` AS `RecipeId`,`rs`.`RecipeStepId` AS `RecipeStepId`,`rs`.`RecipeStepDescription` AS `RecipeStepDescription`,`p`.`ProductName` AS `ProductName`,`p`.`ProductId` AS `ProductId`,`c`.`CategoryName` AS `CategoryName`,`c`.`CategoryDescription` AS `CategoryDescription`,`s`.`SupplierName` AS `SupplierName`,`s`.`SupplierDetails` AS `SupplierDetails`,`rs`.`ProductIdQuantityInMilliliters` AS `ProductIdQuantityInMilliliters`,`rs`.`ProductIdQuantityUnit` AS `ProductIdQuantityUnit`,`p`.`ProductInStockQuantity` AS `ProductInStockQuantity`,`p`.`ProductPricePerUnit` AS `ProductPricePerUnit`,`p`.`ProductUnitSizeInMilliliters` AS `ProductUnitSizeInMilliliters`,`p`.`ProductProof` AS `ProductProof`,`p`.`WorkspaceId` AS `WorkspaceId` FROM (((`app_d`.`recipestep` `rs` JOIN `app_d`.`product` `p` ON((`rs`.`ProductId` = `p`.`ProductId`))) JOIN `app_d`.`category` `c` ON((`p`.`CategoryId` = `c`.`CategoryId`))) JOIN `app_d`.`supplier` `s` ON((`p`.`SupplierId` = `s`.`SupplierId`)));

-- -- Remove recipestep columns
-- ALTER TABLE `app_d`.`recipestep` DROP FOREIGN KEY `fk_recipestep_category`;
-- ALTER TABLE `app_d`.`recipestep` DROP COLUMN `CategoryId`;
-- ALTER TABLE `app_d`.`recipestep` DROP COLUMN `MatchMode`;

-- -- Remove category columns
-- ALTER TABLE `app_d`.`category` DROP FOREIGN KEY `fk_category_basespirit`;
-- ALTER TABLE `app_d`.`category` DROP FOREIGN KEY `fk_category_parent`;
-- ALTER TABLE `app_d`.`category` DROP COLUMN `BaseSpiritId`;
-- ALTER TABLE `app_d`.`category` DROP COLUMN `ParentCategoryId`;
