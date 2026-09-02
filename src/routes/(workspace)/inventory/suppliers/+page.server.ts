import { inventoryRepo } from '$lib/server/core';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { workspace } = await parent();
	const { workspaceId } = workspace;

	const [suppliers, productCounts, supplierTypes] = await Promise.all([
		inventoryRepo.getSuppliers(workspaceId),
		inventoryRepo.getSupplierProductCounts(workspaceId),
		inventoryRepo.getSupplierTypes(),
	]);

	return { suppliers, productCounts, supplierTypes };
};
