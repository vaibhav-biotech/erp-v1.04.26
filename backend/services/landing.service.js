const mongoose = require('mongoose');
const Product = require('../models/Product');

const getCollection = () => mongoose.connection.db.collection('landing_banners');
const getTopPicksCollection = () => mongoose.connection.db.collection('landing_top_picks');

const toObjectId = (value) => {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) return null;
  return new mongoose.Types.ObjectId(value);
};

const normalizeStoreName = (storeName) => {
  const value = (storeName || 'plants in garden').toString().trim().toLowerCase();
  return value || 'plants in garden';
};

const getStoreNameMatchConditions = (storeName) => {
  const normalized = normalizeStoreName(storeName);
  const compact = normalized.replace(/\s+/g, '');

  const values = Array.from(new Set([normalized, compact])).filter(Boolean);

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

const listPublicBanners = async (storeName) => {
  return getCollection()
    .find({ storeName: normalizeStoreName(storeName), isActive: true })
    .sort({ displayOrder: 1, createdAt: -1 })
    .toArray();
};

const listAdminBanners = async (storeName) => {
  return getCollection()
    .find({ storeName: normalizeStoreName(storeName) })
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
    { _id: objectId, storeName: normalizeStoreName(storeName) },
    { $set: payload },
    { returnDocument: 'after' }
  );
};

const removeBanner = async ({ storeName, bannerId }) => {
  const objectId = toObjectId(bannerId);
  if (!objectId) return null;

  return getCollection().deleteOne({ _id: objectId, storeName: normalizeStoreName(storeName) });
};

const reorderBannersByIds = async ({ storeName, orderedBannerIds }) => {
  const objectIds = orderedBannerIds
    .map((id) => toObjectId(id))
    .filter(Boolean);

  if (!objectIds.length) return { matchedCount: 0, modifiedCount: 0 };

  const operations = objectIds.map((objectId, index) => ({
    updateOne: {
      filter: { _id: objectId, storeName: normalizeStoreName(storeName) },
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
  const config = await getTopPicksCollection().findOne({ storeName: normalizeStoreName(storeName) });

  if (!config) return getDefaultTopPicksConfig(storeName);

  return {
    ...getDefaultTopPicksConfig(storeName),
    ...config,
    productIds: Array.isArray(config.productIds) ? config.productIds : [],
    productCount: Number.isFinite(Number(config.productCount)) ? Number(config.productCount) : 4,
  };
};

const upsertTopPicksConfig = async ({ storeName, title, subheading, productCount, productIds }) => {
  const nextStoreName = normalizeStoreName(storeName);
  const normalizedProductIds = Array.isArray(productIds)
    ? productIds.map((id) => String(id)).filter((id) => !!toObjectId(id))
    : [];

  const payload = {
    title: title !== undefined ? String(title || '').trim() : 'Top Picks',
    subheading: subheading !== undefined ? String(subheading || '').trim() : '',
    productCount: Number.isFinite(Number(productCount)) ? Math.max(1, Number(productCount)) : 4,
    productIds: normalizedProductIds,
    updatedAt: new Date(),
  };

  await getTopPicksCollection().updateOne(
    { storeName: nextStoreName },
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
};
