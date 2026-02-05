// assistant tool executor - maps tool calls to repository methods with workspace context
import { catalogRepo, inventoryRepo } from './core';

export class ToolExecutor {
	private workspaceId: string;

	constructor(workspaceId: string) {
		this.workspaceId = workspaceId;
	}

	async execute(toolName: string, args: any): Promise<string> {
		switch (toolName) {
			case 'search_inventory':
				return this.searchInventory(args.query, args.categoryId);
			case 'list_categories':
				return this.listCategories();
			case 'search_categories':
				return this.searchCategories(args.query);
			case 'get_recipe_categories':
				return this.getRecipeCategories();
			case 'get_preparation_methods':
				return this.getPreparationMethods();
			case 'propose_recipe':
				// proposal is returned as-is - the client handles confirmation
				return JSON.stringify({ type: 'proposal', data: args });
			default:
				return JSON.stringify({ error: `Unknown tool: ${toolName}` });
		}
	}

	private async searchInventory(query?: string, categoryId?: number): Promise<string> {
		const filter: any = {};
		if (query) filter.productName = query;
		if (categoryId) filter.categoryId = categoryId;

		const { data } = await inventoryRepo.findAll(this.workspaceId, 1, 50, filter);

		const results = data.map((p) => ({
			productId: p.productId,
			productName: p.productName,
			categoryId: p.categoryId,
			categoryName: p.categoryName,
			inStock: p.productInStockQuantity > 0,
			proof: p.productProof,
			unitSizeMl: p.productUnitSizeInMilliliters,
		}));

		return JSON.stringify(results);
	}

	private async listCategories(): Promise<string> {
		const { data } = await inventoryRepo.findAllCategories(this.workspaceId, 1, 200);

		const results = data.map((c) => ({
			categoryId: c.categoryId,
			categoryName: c.categoryName,
			categoryDescription: c.categoryDescription,
			baseSpiritId: c.baseSpiritId,
			parentCategoryId: c.parentCategoryId,
			productCount: c.productCount,
		}));

		return JSON.stringify(results);
	}

	private async searchCategories(query: string): Promise<string> {
		const { data } = await inventoryRepo.findAllCategories(this.workspaceId, 1, 50, query);

		const results = data.map((c) => ({
			categoryId: c.categoryId,
			categoryName: c.categoryName,
			categoryDescription: c.categoryDescription,
			baseSpiritId: c.baseSpiritId,
			parentCategoryId: c.parentCategoryId,
			productCount: c.productCount,
		}));

		return JSON.stringify(results);
	}

	private async getRecipeCategories(): Promise<string> {
		const result = await catalogRepo.getCategories();
		if (result.status === 'error') {
			return JSON.stringify({ error: result.error });
		}

		const categories = (result.data || []).map((c) => ({
			recipeCategoryId: c.recipeCategoryId,
			recipeCategoryDescription: c.recipeCategoryDescription,
		}));

		return JSON.stringify(categories);
	}

	private async getPreparationMethods(): Promise<string> {
		const result = await catalogRepo.getPreparationMethods();
		if (result.status === 'error') {
			return JSON.stringify({ error: result.error });
		}

		const methods = (result.data || []).map((m) => ({
			recipeTechniqueDescriptionId: m.recipeTechniqueDescriptionId,
			recipeTechniqueDescriptionText: m.recipeTechniqueDescriptionText,
		}));

		return JSON.stringify(methods);
	}
}
