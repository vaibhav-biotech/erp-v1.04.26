const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');

const getCollection = () => mongoose.connection.db.collection('landing_banners');
const getTopPicksCollection = () => mongoose.connection.db.collection('landing_top_picks');
const getOffersCollection = () => mongoose.connection.db.collection('landing_offers');
const getOfferBackgroundsCollection = () => mongoose.connection.db.collection('landing_offer_backgrounds');
const getCategorySectionsCollection = () => mongoose.connection.db.collection('landing_category_sections');
const getFeaturedCollectionsCollection = () => mongoose.connection.db.collection('landing_featured_collections');
const getFeaturedCollectionBackgroundsCollection = () => mongoose.connection.db.collection('landing_featured_collection_backgrounds');

const slugify = (value) => String(value || '')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9\s-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '');

const buildOfferCtaUrl = (title, offerId) => {
  const slug = slugify(title) || 'offer';
  return `/offers/${slug}-${String(offerId)}`;
};

const toObjectId = (value) => {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) return null;
  return new mongoose.Types.ObjectId(value);
};

const normalizeStoreName = (storeName) => {
  const value = (storeName || 'plantsingarden').toString().trim().toLowerCase();
  if (!value) return 'plantsingarden';

  if (value === 'plants in garden' || value === 'plants-in-garden' || value === 'plantingarden') {
    return 'plantsingarden';
  }

  return value.replace(/\s+/g, '');
};

const getStoreNameAliases = (storeName) => {
  const normalized = normalizeStoreName(storeName);
  const compact = normalized.replace(/\s+/g, '');
  const aliases = new Set([normalized, compact]);

  if (aliases.has('plantsingarden') || aliases.has('plantingarden') || aliases.has('plants in garden')) {
    aliases.add('plantsingarden');
    aliases.add('plantingarden');
    aliases.add('plants in garden');
  }

  return Array.from(aliases).filter(Boolean);
};

const getStoreNameMatchConditions = (storeName) => {
  const values = getStoreNameAliases(storeName);

  return [
    { storeName: { $in: values } },
    { storeName: { $exists: false } },
    { storeName: null },
    { storeName: '' },
  ];
};

const getDefaultTopPicksConfig = (storeName) => ({
  storeName: normalizeStoreName(storeName),
  title: 'Top Picks',
  subheading: 'Curated products selected by our store team',
  productCount: 4,
  productIds: [],
});

const ALLOWED_BANNER_GRID_SIZES = new Set(['250x250', '500x250', '600x600']);

const normalizeBannerGridSize = (value) => {
  const nextValue = String(value || '').trim();
  if (ALLOWED_BANNER_GRID_SIZES.has(nextValue)) return nextValue;
  return '250x250';
};

const toPositiveNumberOrNull = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return null;
  return num;
};

const toDateOrNull = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const validateOfferDiscount = ({ offerPercent, discountRupees }) => {
  const percent = toPositiveNumberOrNull(offerPercent);
  const rupees = toPositiveNumberOrNull(discountRupees);

  if ((percent || 0) <= 0 && (rupees || 0) <= 0) {
    throw new Error('Either offerPercent or discountRupees must be greater than 0');
  }

  if (percent !== null && percent > 100) {
    throw new Error('offerPercent cannot be more than 100');
  }

  return {
    offerPercent: percent || 0,
    discountRupees: rupees || 0,
  };
};

const resolveCategoryAndProduct = async ({ categoryId, productId, productIds, storeName }) => {
  const categoryObjectId = toObjectId(categoryId);

  if (!categoryObjectId) {
    throw new Error('Valid categoryId is required');
  }

  const category = await Category.findById(categoryObjectId).lean();
  if (!category) {
    throw new Error('Selected category not found');
  }

  const normalizedProductIds = Array.isArray(productIds)
    ? productIds.map((id) => String(id)).filter((id) => !!toObjectId(id))
    : [];

  if (normalizedProductIds.length === 0 && productId && toObjectId(productId)) {
    normalizedProductIds.push(String(productId));
  }

  if (normalizedProductIds.length === 0) {
    throw new Error('At least one valid product id is required');
  }

  const productObjectIds = normalizedProductIds.map((id) => toObjectId(id)).filter(Boolean);

  const products = await Product.find({
    _id: { $in: productObjectIds },
    category: String(category._id),
    $or: getStoreNameMatchConditions(storeName),
  }).lean();

  if (!products.length || products.length !== normalizedProductIds.length) {
    throw new Error('One or more selected products are not found in selected category');
  }

  const productMap = new Map(products.map((product) => [String(product._id), product]));
  const orderedProducts = normalizedProductIds
    .map((id) => productMap.get(String(id)))
    .filter(Boolean);

  const orderedProductIds = orderedProducts.map((product) => String(product._id));
  const orderedProductNames = orderedProducts.map((product) => product.name || '');

  return {
    categoryId: String(category._id),
    categoryName: category.name || '',
    categorySlug: category.slug || (category.name || '').toLowerCase().replace(/\s+/g, '-'),
    productId: orderedProductIds[0],
    productName: orderedProductNames[0],
    productIds: orderedProductIds,
    productNames: orderedProductNames,
  };
};

const listPublicBanners = async (storeName) => {
  return getCollection()
    .find({ storeName: { $in: getStoreNameAliases(storeName) }, isActive: true })
    .sort({ displayOrder: 1, createdAt: -1 })
    .toArray();
};

const listAdminBanners = async (storeName) => {
  return getCollection()
    .find({ storeName: { $in: getStoreNameAliases(storeName) } })
    .sort({ displayOrder: 1, createdAt: -1 })
    .toArray();
};

const insertBanner = async ({ storeName, title, imageUrl, isActive, displayOrder }) => {
  const now = new Date();
  const banner = {
    _id: new mongoose.Types.ObjectId(),
    storeName: normalizeStoreName(storeName),
    title: title ? String(title).trim() : '',
    imageUrl: String(imageUrl).trim(),
    isActive: typeof isActive === 'boolean' ? isActive : true,
    displayOrder: Number.isFinite(Number(displayOrder)) ? Number(displayOrder) : 0,
    width: 1080,
    height: 450,
    createdAt: now,
    updatedAt: now,
  };

  await getCollection().insertOne(banner);
  return banner;
};

const patchBanner = async ({ storeName, bannerId, title, imageUrl, isActive, displayOrder }) => {
  const objectId = toObjectId(bannerId);
  if (!objectId) return null;

  const payload = { updatedAt: new Date() };

  if (title !== undefined) payload.title = String(title || '').trim();
  if (imageUrl !== undefined) payload.imageUrl = String(imageUrl || '').trim();
  if (isActive !== undefined) payload.isActive = !!isActive;
  if (displayOrder !== undefined) {
    payload.displayOrder = Number.isFinite(Number(displayOrder)) ? Number(displayOrder) : 0;
  }

  return getCollection().findOneAndUpdate(
    { _id: objectId, storeName: { $in: getStoreNameAliases(storeName) } },
    { $set: payload },
    { returnDocument: 'after' }
  );
};

const removeBanner = async ({ storeName, bannerId }) => {
  const objectId = toObjectId(bannerId);
  if (!objectId) return null;

  return getCollection().deleteOne({ _id: objectId, storeName: { $in: getStoreNameAliases(storeName) } });
};

const reorderBannersByIds = async ({ storeName, orderedBannerIds }) => {
  const objectIds = orderedBannerIds
    .map((id) => toObjectId(id))
    .filter(Boolean);

  if (!objectIds.length) return { matchedCount: 0, modifiedCount: 0 };

  const operations = objectIds.map((objectId, index) => ({
    updateOne: {
      filter: { _id: objectId, storeName: { $in: getStoreNameAliases(storeName) } },
      update: {
        $set: {
          displayOrder: index,
          updatedAt: new Date(),
        },
      },
    },
  }));

  return getCollection().bulkWrite(operations, { ordered: true });
};

const getTopPicksConfig = async (storeName) => {
  const config = await getTopPicksCollection()
    .find({ storeName: { $in: getStoreNameAliases(storeName) } })
    .sort({ updatedAt: -1, createdAt: -1 })
    .limit(1)
    .next();

  if (!config) return getDefaultTopPicksConfig(storeName);

  return {
    ...getDefaultTopPicksConfig(storeName),
    ...config,
    productIds: Array.isArray(config.productIds)
      ? config.productIds
        .map((id) => String(id || ''))
        .filter((id) => !!toObjectId(id))
      : [],
    productCount: Number.isFinite(Number(config.productCount)) ? Number(config.productCount) : 4,
  };
};

const upsertTopPicksConfig = async ({ storeName, title, subheading, productCount, productIds }) => {
  const nextStoreName = normalizeStoreName(storeName);
  const normalizedProductIds = Array.isArray(productIds)
    ? productIds.map((id) => String(id)).filter((id) => !!toObjectId(id))
    : [];

  const uniqueProductIds = Array.from(new Set(normalizedProductIds));
  const validProducts = await Product.find({
    _id: { $in: uniqueProductIds.map((id) => toObjectId(id)).filter(Boolean) },
    $or: getStoreNameMatchConditions(nextStoreName),
    status: 'active',
  })
    .select('_id')
    .lean();

  const validProductIds = new Set(validProducts.map((p) => String(p._id)));
  const filteredProductIds = uniqueProductIds.filter((id) => validProductIds.has(String(id)));

  const payload = {
    title: title !== undefined ? String(title || '').trim() : 'Top Picks',
    subheading: subheading !== undefined ? String(subheading || '').trim() : '',
    productCount: Number.isFinite(Number(productCount)) ? Math.max(1, Number(productCount)) : 4,
    productIds: filteredProductIds,
    updatedAt: new Date(),
  };

  await getTopPicksCollection().updateOne(
    { storeName: { $in: getStoreNameAliases(nextStoreName) } },
    {
      $set: payload,
      $setOnInsert: {
        _id: new mongoose.Types.ObjectId(),
        storeName: nextStoreName,
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );

  return getTopPicksConfig(nextStoreName);
};

const listTopPicksSelectableProducts = async (storeName, limit = 100) => {
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Math.min(Number(limit), 300)) : 100;

  const products = await Product.find({
    $or: getStoreNameMatchConditions(storeName),
    status: 'active',
  })
    .sort({ createdAt: -1 })
    .limit(safeLimit)
    .lean();

  return products.map((product) => ({
    _id: String(product._id),
    name: product.name,
    finalPrice: product.finalPrice,
    images: Array.isArray(product.images) ? product.images : [],
  }));
};

const getTopPicksPublicData = async (storeName) => {
  const config = await getTopPicksConfig(storeName);

  const objectIds = (config.productIds || [])
    .map((id) => toObjectId(id))
    .filter(Boolean);

  if (objectIds.length === 0) {
    return {
      title: config.title,
      subheading: config.subheading,
      productCount: config.productCount,
      products: [],
    };
  }

  const products = await Product.find({
    _id: { $in: objectIds },
    $or: getStoreNameMatchConditions(storeName),
    status: 'active',
  }).lean();

  const productMap = new Map(products.map((item) => [String(item._id), item]));
  const orderedProducts = (config.productIds || [])
    .map((id) => productMap.get(String(id)))
    .filter(Boolean)
    .slice(0, config.productCount || 4);

  return {
    title: config.title,
    subheading: config.subheading,
    productCount: config.productCount,
    products: orderedProducts,
  };
};

const listPublicOffers = async (storeName) => {
  const offers = await getOffersCollection()
    .find({
      storeName: { $in: getStoreNameAliases(storeName) },
      isActive: true,
    })
    .sort({ displayOrder: 1, createdAt: -1 })
    .toArray();

  return offers.map((offer) => ({
    ...offer,
    ctaUrl: buildOfferCtaUrl(offer.title, offer._id),
  }));
};

const listAdminOffers = async (storeName) => {
  const offers = await getOffersCollection()
    .find({ storeName: { $in: getStoreNameAliases(storeName) } })
    .sort({ displayOrder: 1, createdAt: -1 })
    .toArray();

  return offers.map((offer) => ({
    ...offer,
    ctaUrl: buildOfferCtaUrl(offer.title, offer._id),
  }));
};

const getPublicOfferById = async ({ storeName, offerId }) => {
  const objectId = toObjectId(offerId);
  if (!objectId) return null;

  const offer = await getOffersCollection().findOne({
    _id: objectId,
    storeName: { $in: getStoreNameAliases(storeName) },
    isActive: true,
  });

  if (!offer) return null;

  const productIds = Array.isArray(offer.productIds) && offer.productIds.length > 0
    ? offer.productIds
    : (offer.productId ? [offer.productId] : []);

  const objectIds = productIds.map((id) => toObjectId(id)).filter(Boolean);

  const products = objectIds.length > 0
    ? await Product.find({
      _id: { $in: objectIds },
      $or: getStoreNameMatchConditions(storeName),
      status: 'active',
    }).lean()
    : [];

  const map = new Map(products.map((product) => [String(product._id), product]));
  const orderedProducts = productIds
    .map((id) => map.get(String(id)))
    .filter(Boolean);

  return {
    offer: {
      ...offer,
      ctaUrl: buildOfferCtaUrl(offer.title, offer._id),
    },
    products: orderedProducts,
  };
};

const insertOffer = async ({
  storeName,
  title,
  description,
  offerPercent,
  showOfferBadge,
  discountRupees,
  categoryId,
  productId,
  productIds,
  bannerImage,
  bannerGridSize,
  gridPosition,
  minimumOrderValue,
  startDate,
  endDate,
  isActive,
  displayOrder,
}) => {
  if (!title || !String(title).trim()) {
    throw new Error('title is required');
  }

  if (!bannerImage || !String(bannerImage).trim()) {
    throw new Error('bannerImage is required');
  }

  const discount = validateOfferDiscount({ offerPercent, discountRupees });
  const categoryProduct = await resolveCategoryAndProduct({ categoryId, productId, productIds, storeName });

  const now = new Date();
  const startDateValue = toDateOrNull(startDate);
  const endDateValue = toDateOrNull(endDate);

  if (startDateValue && endDateValue && startDateValue > endDateValue) {
    throw new Error('startDate cannot be after endDate');
  }

  const offer = {
    _id: new mongoose.Types.ObjectId(),
    storeName: normalizeStoreName(storeName),
    title: String(title).trim(),
    description: description ? String(description).trim() : '',
    offerPercent: discount.offerPercent,
    showOfferBadge: showOfferBadge !== false,
    discountRupees: discount.discountRupees,
    categoryId: categoryProduct.categoryId,
    categoryName: categoryProduct.categoryName,
    categorySlug: categoryProduct.categorySlug,
    productId: categoryProduct.productId,
    productName: categoryProduct.productName,
    productIds: categoryProduct.productIds,
    productNames: categoryProduct.productNames,
    ctaUrl: '',
    bannerImage: String(bannerImage).trim(),
    bannerGridSize: normalizeBannerGridSize(bannerGridSize),
    gridPosition: Number.isFinite(Number(gridPosition)) ? Math.min(Math.max(Number(gridPosition), 1), 4) : (Number.isFinite(Number(displayOrder)) ? Number(displayOrder) + 1 : 1),
    minimumOrderValue: toPositiveNumberOrNull(minimumOrderValue) || 0,
    startDate: startDateValue,
    endDate: endDateValue,
    isActive: typeof isActive === 'boolean' ? isActive : true,
    displayOrder: Number.isFinite(Number(displayOrder)) ? Number(displayOrder) : 0,
    createdAt: now,
    updatedAt: now,
  };

  offer.ctaUrl = buildOfferCtaUrl(offer.title, offer._id);

  await getOffersCollection().insertOne(offer);
  return offer;
};

const patchOffer = async ({
  storeName,
  offerId,
  title,
  description,
  offerPercent,
  showOfferBadge,
  discountRupees,
  categoryId,
  productId,
  productIds,
  bannerImage,
  bannerGridSize,
  gridPosition,
  minimumOrderValue,
  startDate,
  endDate,
  isActive,
  displayOrder,
}) => {
  const objectId = toObjectId(offerId);
  if (!objectId) return null;

  const existing = await getOffersCollection().findOne({
    _id: objectId,
    storeName: { $in: getStoreNameAliases(storeName) },
  });

  if (!existing) return null;

  const payload = { updatedAt: new Date() };

  if (title !== undefined) payload.title = String(title || '').trim();
  if (description !== undefined) payload.description = String(description || '').trim();
  if (showOfferBadge !== undefined) payload.showOfferBadge = !!showOfferBadge;
  if (bannerImage !== undefined) payload.bannerImage = String(bannerImage || '').trim();
  if (bannerGridSize !== undefined) payload.bannerGridSize = normalizeBannerGridSize(bannerGridSize);
  if (gridPosition !== undefined) payload.gridPosition = Number.isFinite(Number(gridPosition)) ? Math.min(Math.max(Number(gridPosition), 1), 4) : 1;
  if (minimumOrderValue !== undefined) payload.minimumOrderValue = toPositiveNumberOrNull(minimumOrderValue) || 0;
  if (isActive !== undefined) payload.isActive = !!isActive;
  if (displayOrder !== undefined) payload.displayOrder = Number.isFinite(Number(displayOrder)) ? Number(displayOrder) : 0;

  if (startDate !== undefined) payload.startDate = toDateOrNull(startDate);
  if (endDate !== undefined) payload.endDate = toDateOrNull(endDate);

  const nextOfferPercent = offerPercent !== undefined ? offerPercent : existing.offerPercent;
  const nextDiscountRupees = discountRupees !== undefined ? discountRupees : existing.discountRupees;
  const discount = validateOfferDiscount({
    offerPercent: nextOfferPercent,
    discountRupees: nextDiscountRupees,
  });
  payload.offerPercent = discount.offerPercent;
  payload.discountRupees = discount.discountRupees;

  const nextCategoryId = categoryId !== undefined ? categoryId : existing.categoryId;
  const nextProductIds = productIds !== undefined
    ? productIds
    : (Array.isArray(existing.productIds) && existing.productIds.length > 0
      ? existing.productIds
      : [existing.productId]);
  const nextProductId = productId !== undefined ? productId : existing.productId;
  if (nextCategoryId || nextProductId || (Array.isArray(nextProductIds) && nextProductIds.length > 0)) {
    const categoryProduct = await resolveCategoryAndProduct({
      categoryId: nextCategoryId,
      productId: nextProductId,
      productIds: nextProductIds,
      storeName,
    });
    payload.categoryId = categoryProduct.categoryId;
    payload.categoryName = categoryProduct.categoryName;
    payload.categorySlug = categoryProduct.categorySlug;
    payload.productId = categoryProduct.productId;
    payload.productName = categoryProduct.productName;
    payload.productIds = categoryProduct.productIds;
    payload.productNames = categoryProduct.productNames;
  }

  if (title !== undefined) {
    payload.ctaUrl = buildOfferCtaUrl(payload.title || existing.title, existing._id);
  }

  if (!existing.ctaUrl) {
    payload.ctaUrl = buildOfferCtaUrl(payload.title || existing.title, existing._id);
  }

  const finalStartDate = payload.startDate !== undefined ? payload.startDate : existing.startDate;
  const finalEndDate = payload.endDate !== undefined ? payload.endDate : existing.endDate;
  if (finalStartDate && finalEndDate && new Date(finalStartDate) > new Date(finalEndDate)) {
    throw new Error('startDate cannot be after endDate');
  }

  return getOffersCollection().findOneAndUpdate(
    { _id: objectId, storeName: { $in: getStoreNameAliases(storeName) } },
    { $set: payload },
    { returnDocument: 'after' }
  );
};

const removeOffer = async ({ storeName, offerId }) => {
  const objectId = toObjectId(offerId);
  if (!objectId) return null;

  return getOffersCollection().deleteOne({
    _id: objectId,
    storeName: { $in: getStoreNameAliases(storeName) },
  });
};

const listPublicOfferBackgrounds = async (storeName) => {
  return getOfferBackgroundsCollection()
    .find({
      storeName: { $in: getStoreNameAliases(storeName) },
      isActive: true,
    })
    .sort({ displayOrder: 1, createdAt: -1 })
    .toArray();
};

const listAdminOfferBackgrounds = async (storeName) => {
  return getOfferBackgroundsCollection()
    .find({ storeName: { $in: getStoreNameAliases(storeName) } })
    .sort({ displayOrder: 1, createdAt: -1 })
    .toArray();
};

const insertOfferBackground = async ({ storeName, title, imageUrl, isActive, displayOrder }) => {
  if (!imageUrl || !String(imageUrl).trim()) {
    throw new Error('imageUrl is required');
  }

  const now = new Date();
  const normalizedStoreName = normalizeStoreName(storeName);
  const makeActive = typeof isActive === 'boolean' ? isActive : true;

  if (makeActive) {
    await getOfferBackgroundsCollection().updateMany(
      { storeName: { $in: getStoreNameAliases(normalizedStoreName) } },
      { $set: { isActive: false, updatedAt: now } }
    );
  }

  const item = {
    _id: new mongoose.Types.ObjectId(),
    storeName: normalizedStoreName,
    title: title ? String(title).trim() : '',
    imageUrl: String(imageUrl).trim(),
    isActive: makeActive,
    displayOrder: Number.isFinite(Number(displayOrder)) ? Number(displayOrder) : 0,
    createdAt: now,
    updatedAt: now,
  };

  await getOfferBackgroundsCollection().insertOne(item);
  return item;
};

const patchOfferBackground = async ({ storeName, backgroundId, title, imageUrl, isActive, displayOrder }) => {
  const objectId = toObjectId(backgroundId);
  if (!objectId) return null;

  const existing = await getOfferBackgroundsCollection().findOne({
    _id: objectId,
    storeName: { $in: getStoreNameAliases(storeName) },
  });

  if (!existing) return null;

  const payload = { updatedAt: new Date() };
  if (title !== undefined) payload.title = String(title || '').trim();
  if (imageUrl !== undefined) payload.imageUrl = String(imageUrl || '').trim();
  if (displayOrder !== undefined) payload.displayOrder = Number.isFinite(Number(displayOrder)) ? Number(displayOrder) : 0;
  if (isActive !== undefined) payload.isActive = !!isActive;

  if (payload.isActive === true) {
    await getOfferBackgroundsCollection().updateMany(
      {
        _id: { $ne: objectId },
        storeName: { $in: getStoreNameAliases(storeName) },
      },
      { $set: { isActive: false, updatedAt: payload.updatedAt } }
    );
  }

  return getOfferBackgroundsCollection().findOneAndUpdate(
    { _id: objectId, storeName: { $in: getStoreNameAliases(storeName) } },
    { $set: payload },
    { returnDocument: 'after' }
  );
};

const removeOfferBackground = async ({ storeName, backgroundId }) => {
  const objectId = toObjectId(backgroundId);
  if (!objectId) return null;

  return getOfferBackgroundsCollection().deleteOne({
    _id: objectId,
    storeName: { $in: getStoreNameAliases(storeName) },
  });
};

const listPublicCategorySections = async (storeName) => {
  const items = await getCategorySectionsCollection()
    .find({
      storeName: { $in: getStoreNameAliases(storeName) },
      isActive: true,
    })
    .sort({ displayOrder: 1, createdAt: -1 })
    .toArray();

  return items;
};

const listAdminCategorySections = async (storeName) => {
  const items = await getCategorySectionsCollection()
    .find({
      storeName: { $in: getStoreNameAliases(storeName) },
    })
    .sort({ displayOrder: 1, createdAt: -1 })
    .toArray();

  return items;
};

const insertCategorySection = async ({
  storeName,
  categoryId,
  imageUrl,
  isActive,
  displayOrder,
}) => {
  const objectId = toObjectId(categoryId);
  if (!objectId) throw new Error('Valid categoryId is required');

  const category = await Category.findById(objectId).lean();
  if (!category) throw new Error('Category not found');

  const now = new Date();
  const payload = {
    _id: new mongoose.Types.ObjectId(),
    storeName: normalizeStoreName(storeName),
    categoryId: String(category._id),
    categoryName: String(category.name || '').trim(),
    categorySlug: String(category.slug || '').trim(),
    imageUrl: String(imageUrl || '').trim(),
    isActive: typeof isActive === 'boolean' ? isActive : true,
    displayOrder: Number.isFinite(Number(displayOrder)) ? Number(displayOrder) : 0,
    createdAt: now,
    updatedAt: now,
  };

  await getCategorySectionsCollection().insertOne(payload);
  return payload;
};

const patchCategorySection = async ({
  storeName,
  itemId,
  categoryId,
  imageUrl,
  isActive,
  displayOrder,
}) => {
  const objectId = toObjectId(itemId);
  if (!objectId) return null;

  const existing = await getCategorySectionsCollection().findOne({
    _id: objectId,
    storeName: { $in: getStoreNameAliases(storeName) },
  });
  if (!existing) return null;

  const payload = { updatedAt: new Date() };

  if (categoryId !== undefined) {
    const categoryObjectId = toObjectId(categoryId);
    if (!categoryObjectId) throw new Error('Valid categoryId is required');
    const category = await Category.findById(categoryObjectId).lean();
    if (!category) throw new Error('Category not found');

    payload.categoryId = String(category._id);
    payload.categoryName = String(category.name || '').trim();
    payload.categorySlug = String(category.slug || '').trim();
  }

  if (imageUrl !== undefined) payload.imageUrl = String(imageUrl || '').trim();
  if (isActive !== undefined) payload.isActive = !!isActive;
  if (displayOrder !== undefined) {
    payload.displayOrder = Number.isFinite(Number(displayOrder)) ? Number(displayOrder) : 0;
  }

  return getCategorySectionsCollection().findOneAndUpdate(
    {
      _id: objectId,
      storeName: { $in: getStoreNameAliases(storeName) },
    },
    { $set: payload },
    { returnDocument: 'after' }
  );
};

const listPublicFeaturedCollections = async (storeName) => {
  return getFeaturedCollectionsCollection()
    .find({
      storeName: { $in: getStoreNameAliases(storeName) },
      isActive: true,
    })
    .sort({ displayOrder: 1, createdAt: -1 })
    .toArray();
};

const listAdminFeaturedCollections = async (storeName) => {
  return getFeaturedCollectionsCollection()
    .find({
      storeName: { $in: getStoreNameAliases(storeName) },
    })
    .sort({ displayOrder: 1, createdAt: -1 })
    .toArray();
};

const insertFeaturedCollection = async ({
  storeName,
  title,
  subtitle,
  tag,
  imageUrl,
  isActive,
  displayOrder,
}) => {
  const safeTitle = String(title || '').trim();
  const safeTag = slugify(tag || title || '');

  if (!safeTitle) throw new Error('Title is required');
  if (!safeTag) throw new Error('Tag is required');

  const now = new Date();
  const payload = {
    _id: new mongoose.Types.ObjectId(),
    storeName: normalizeStoreName(storeName),
    title: safeTitle,
    subtitle: String(subtitle || '').trim(),
    tag: safeTag,
    imageUrl: String(imageUrl || '').trim(),
    isActive: typeof isActive === 'boolean' ? isActive : true,
    displayOrder: Number.isFinite(Number(displayOrder)) ? Number(displayOrder) : 0,
    createdAt: now,
    updatedAt: now,
  };

  await getFeaturedCollectionsCollection().insertOne(payload);
  return payload;
};

const patchFeaturedCollection = async ({
  storeName,
  itemId,
  title,
  subtitle,
  tag,
  imageUrl,
  isActive,
  displayOrder,
}) => {
  const objectId = toObjectId(itemId);
  if (!objectId) return null;

  const existing = await getFeaturedCollectionsCollection().findOne({
    _id: objectId,
    storeName: { $in: getStoreNameAliases(storeName) },
  });

  if (!existing) return null;

  const payload = { updatedAt: new Date() };
  if (title !== undefined) {
    const safeTitle = String(title || '').trim();
    if (!safeTitle) throw new Error('Title is required');
    payload.title = safeTitle;
  }
  if (subtitle !== undefined) payload.subtitle = String(subtitle || '').trim();
  if (tag !== undefined) {
    const safeTag = slugify(tag || '');
    if (!safeTag) throw new Error('Tag is required');
    payload.tag = safeTag;
  }
  if (imageUrl !== undefined) payload.imageUrl = String(imageUrl || '').trim();
  if (isActive !== undefined) payload.isActive = !!isActive;
  if (displayOrder !== undefined) payload.displayOrder = Number.isFinite(Number(displayOrder)) ? Number(displayOrder) : 0;

  return getFeaturedCollectionsCollection().findOneAndUpdate(
    {
      _id: objectId,
      storeName: { $in: getStoreNameAliases(storeName) },
    },
    { $set: payload },
    { returnDocument: 'after' }
  );
};

const listPublicFeaturedCollectionBackgrounds = async (storeName) => {
  return getFeaturedCollectionBackgroundsCollection()
    .find({
      storeName: { $in: getStoreNameAliases(storeName) },
      isActive: true,
    })
    .sort({ displayOrder: 1, createdAt: -1 })
    .toArray();
};

const listAdminFeaturedCollectionBackgrounds = async (storeName) => {
  return getFeaturedCollectionBackgroundsCollection()
    .find({
      storeName: { $in: getStoreNameAliases(storeName) },
    })
    .sort({ displayOrder: 1, createdAt: -1 })
    .toArray();
};

const insertFeaturedCollectionBackground = async ({ storeName, title, imageUrl, isActive, displayOrder }) => {
  const now = new Date();
  const item = {
    _id: new mongoose.Types.ObjectId(),
    storeName: normalizeStoreName(storeName),
    title: title ? String(title).trim() : '',
    imageUrl: String(imageUrl).trim(),
    isActive: typeof isActive === 'boolean' ? isActive : true,
    displayOrder: Number.isFinite(Number(displayOrder)) ? Number(displayOrder) : 0,
    createdAt: now,
    updatedAt: now,
  };

  if (item.isActive) {
    await getFeaturedCollectionBackgroundsCollection().updateMany(
      { storeName: { $in: getStoreNameAliases(storeName) } },
      { $set: { isActive: false, updatedAt: now } }
    );
  }

  await getFeaturedCollectionBackgroundsCollection().insertOne(item);
  return item;
};

const patchFeaturedCollectionBackground = async ({ storeName, backgroundId, title, imageUrl, isActive, displayOrder }) => {
  const objectId = toObjectId(backgroundId);
  if (!objectId) return null;

  const existing = await getFeaturedCollectionBackgroundsCollection().findOne({
    _id: objectId,
    storeName: { $in: getStoreNameAliases(storeName) },
  });
  if (!existing) return null;

  const payload = { updatedAt: new Date() };
  if (title !== undefined) payload.title = String(title || '').trim();
  if (imageUrl !== undefined) payload.imageUrl = String(imageUrl || '').trim();
  if (displayOrder !== undefined) payload.displayOrder = Number.isFinite(Number(displayOrder)) ? Number(displayOrder) : 0;
  if (isActive !== undefined) payload.isActive = !!isActive;

  if (payload.isActive === true) {
    await getFeaturedCollectionBackgroundsCollection().updateMany(
      { _id: { $ne: objectId }, storeName: { $in: getStoreNameAliases(storeName) } },
      { $set: { isActive: false, updatedAt: payload.updatedAt } }
    );
  }

  return getFeaturedCollectionBackgroundsCollection().findOneAndUpdate(
    { _id: objectId, storeName: { $in: getStoreNameAliases(storeName) } },
    { $set: payload },
    { returnDocument: 'after' }
  );
};

const removeFeaturedCollectionBackground = async ({ storeName, backgroundId }) => {
  const objectId = toObjectId(backgroundId);
  if (!objectId) return null;

  return getFeaturedCollectionBackgroundsCollection().deleteOne({
    _id: objectId,
    storeName: { $in: getStoreNameAliases(storeName) },
  });
};

module.exports = {
  toObjectId,
  listPublicBanners,
  listAdminBanners,
  insertBanner,
  patchBanner,
  removeBanner,
  reorderBannersByIds,
  getTopPicksConfig,
  upsertTopPicksConfig,
  listTopPicksSelectableProducts,
  getTopPicksPublicData,
  listPublicOffers,
  listAdminOffers,
  getPublicOfferById,
  insertOffer,
  patchOffer,
  removeOffer,
  listPublicOfferBackgrounds,
  listAdminOfferBackgrounds,
  insertOfferBackground,
  patchOfferBackground,
  removeOfferBackground,
  listPublicCategorySections,
  listAdminCategorySections,
  insertCategorySection,
  patchCategorySection,
  listPublicFeaturedCollections,
  listAdminFeaturedCollections,
  insertFeaturedCollection,
  patchFeaturedCollection,
  listPublicFeaturedCollectionBackgrounds,
  listAdminFeaturedCollectionBackgrounds,
  insertFeaturedCollectionBackground,
  patchFeaturedCollectionBackground,
  removeFeaturedCollectionBackground,
};
