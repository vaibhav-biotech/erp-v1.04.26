const {
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
  listPublicGiftBanners,
  listAdminGiftBanners,
  insertGiftBanner,
  patchGiftBanner,
  listPublicCareImages,
  listAdminCareImages,
  insertCareImage,
  patchCareImage,
  listAdminStaticPages,
  getPublicStaticPageBySlug,
  upsertStaticPage,
  getPublicFooterSettings,
  getAdminFooterSettings,
  upsertFooterSettings,
} = require('../services/landing.service');

const getStoreName = (req) => req.storeName || 'plantsingarden';

const getPublicBanners = async (req, res) => {
  try {
    const storeName = getStoreName(req);
    const banners = await listPublicBanners(storeName);

    return res.json({ success: true, data: banners });
  } catch (error) {
    console.error('❌ Error fetching landing banners:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch landing banners',
      error: error.message,
    });
  }
};

const getAdminBanners = async (req, res) => {
  try {
    const storeName = getStoreName(req);
    const banners = await listAdminBanners(storeName);

    return res.json({ success: true, data: banners });
  } catch (error) {
    console.error('❌ Error fetching admin landing banners:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch landing banners',
      error: error.message,
    });
  }
};

const createBanner = async (req, res) => {
  try {
    const storeName = getStoreName(req);
    const { title, imageUrl, isActive, displayOrder } = req.body || {};

    if (!imageUrl || !String(imageUrl).trim()) {
      return res.status(400).json({ success: false, message: 'imageUrl is required' });
    }

    const banner = await insertBanner({ storeName, title, imageUrl, isActive, displayOrder });

    return res.status(201).json({
      success: true,
      message: 'Banner created successfully',
      data: banner,
    });
  } catch (error) {
    console.error('❌ Error creating landing banner:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create banner',
      error: error.message,
    });
  }
};

const updateBanner = async (req, res) => {
  try {
    const storeName = getStoreName(req);
    const { bannerId } = req.params;

    if (!toObjectId(bannerId)) {
      return res.status(400).json({ success: false, message: 'Invalid banner id' });
    }

    const { title, imageUrl, isActive, displayOrder } = req.body || {};

    const result = await patchBanner({
      storeName,
      bannerId,
      title,
      imageUrl,
      isActive,
      displayOrder,
    });

    if (!result) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    return res.json({ success: true, message: 'Banner updated successfully', data: result });
  } catch (error) {
    console.error('❌ Error updating landing banner:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update banner',
      error: error.message,
    });
  }
};

const deleteBanner = async (req, res) => {
  try {
    const storeName = getStoreName(req);
    const { bannerId } = req.params;

    if (!toObjectId(bannerId)) {
      return res.status(400).json({ success: false, message: 'Invalid banner id' });
    }

    const result = await removeBanner({ storeName, bannerId });

    if (!result || result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    return res.json({ success: true, message: 'Banner deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting landing banner:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete banner',
      error: error.message,
    });
  }
};

const reorderBanners = async (req, res) => {
  try {
    const storeName = getStoreName(req);
    const { orderedBannerIds } = req.body || {};

    if (!Array.isArray(orderedBannerIds) || orderedBannerIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'orderedBannerIds array is required',
      });
    }

    await reorderBannersByIds({ storeName, orderedBannerIds });

    return res.json({
      success: true,
      message: 'Banner order updated successfully',
    });
  } catch (error) {
    console.error('❌ Error reordering landing banners:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reorder banners',
      error: error.message,
    });
  }
};

const getPublicTopPicks = async (req, res) => {
  try {
    const storeName = getStoreName(req);
    const data = await getTopPicksPublicData(storeName);

    return res.json({ success: true, data });
  } catch (error) {
    console.error('❌ Error fetching public top picks:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch top picks',
      error: error.message,
    });
  }
};

const getAdminTopPicks = async (req, res) => {
  try {
    const storeName = getStoreName(req);
    const [config, selectableProducts] = await Promise.all([
      getTopPicksConfig(storeName),
      listTopPicksSelectableProducts(storeName),
    ]);

    return res.json({
      success: true,
      data: {
        config,
        selectableProducts,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching admin top picks:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch top picks settings',
      error: error.message,
    });
  }
};

const updateAdminTopPicks = async (req, res) => {
  try {
    const storeName = getStoreName(req);
    const { title, subheading, productCount, productIds } = req.body || {};

    const config = await upsertTopPicksConfig({
      storeName,
      title,
      subheading,
      productCount,
      productIds,
    });

    return res.json({
      success: true,
      message: 'Top picks settings updated successfully',
      data: config,
    });
  } catch (error) {
    console.error('❌ Error updating admin top picks:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update top picks settings',
      error: error.message,
    });
  }
};

const getPublicOffers = async (req, res) => {
  try {
    const storeName = getStoreName(req);
    const offers = await listPublicOffers(storeName);

    return res.json({ success: true, data: offers });
  } catch (error) {
    console.error('❌ Error fetching public offers:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch offers',
      error: error.message,
    });
  }
};

const getAdminOffers = async (req, res) => {
  try {
    const storeName = getStoreName(req);
    const offers = await listAdminOffers(storeName);

    return res.json({ success: true, data: offers });
  } catch (error) {
    console.error('❌ Error fetching admin offers:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch offers',
      error: error.message,
    });
  }
};

const getPublicOfferProducts = async (req, res) => {
  try {
    const storeName = getStoreName(req);
    const { offerId } = req.params;

    const result = await getPublicOfferById({ storeName, offerId });
    if (!result) {
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('❌ Error fetching public offer products:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch offer products',
      error: error.message,
    });
  }
};

const createOffer = async (req, res) => {
  try {
    const storeName = getStoreName(req);
    const offer = await insertOffer({
      storeName,
      ...(req.body || {}),
    });

    return res.status(201).json({
      success: true,
      message: 'Offer created successfully',
      data: offer,
    });
  } catch (error) {
    console.error('❌ Error creating offer:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to create offer',
    });
  }
};

const updateOffer = async (req, res) => {
  try {
    const storeName = getStoreName(req);
    const { offerId } = req.params;

    if (!toObjectId(offerId)) {
      return res.status(400).json({ success: false, message: 'Invalid offer id' });
    }

    const updated = await patchOffer({
      storeName,
      offerId,
      ...(req.body || {}),
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }

    return res.json({ success: true, message: 'Offer updated successfully', data: updated });
  } catch (error) {
    console.error('❌ Error updating offer:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to update offer',
    });
  }
};

const deleteOffer = async (req, res) => {
  try {
    const storeName = getStoreName(req);
    const { offerId } = req.params;

    if (!toObjectId(offerId)) {
      return res.status(400).json({ success: false, message: 'Invalid offer id' });
    }

    const removed = await removeOffer({ storeName, offerId });

    if (!removed || removed.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }

    return res.json({ success: true, message: 'Offer deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting offer:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete offer',
      error: error.message,
    });
  }
};

const getPublicOfferBackgrounds = async (req, res) => {
  try {
    const storeName = getStoreName(req);
    const items = await listPublicOfferBackgrounds(storeName);

    return res.json({ success: true, data: items });
  } catch (error) {
    console.error('❌ Error fetching public offer backgrounds:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch offer backgrounds',
      error: error.message,
    });
  }
};

const getAdminOfferBackgrounds = async (req, res) => {
  try {
    const storeName = getStoreName(req);
    const items = await listAdminOfferBackgrounds(storeName);

    return res.json({ success: true, data: items });
  } catch (error) {
    console.error('❌ Error fetching admin offer backgrounds:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch offer backgrounds',
      error: error.message,
    });
  }
};

const createOfferBackground = async (req, res) => {
  try {
    const storeName = getStoreName(req);
    const item = await insertOfferBackground({
      storeName,
      ...(req.body || {}),
    });

    return res.status(201).json({
      success: true,
      message: 'Offer background created successfully',
      data: item,
    });
  } catch (error) {
    console.error('❌ Error creating offer background:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to create offer background',
    });
  }
};

const updateOfferBackground = async (req, res) => {
  try {
    const storeName = getStoreName(req);
    const { backgroundId } = req.params;

    if (!toObjectId(backgroundId)) {
      return res.status(400).json({ success: false, message: 'Invalid background id' });
    }

    const updated = await patchOfferBackground({
      storeName,
      backgroundId,
      ...(req.body || {}),
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Offer background not found' });
    }

    return res.json({
      success: true,
      message: 'Offer background updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('❌ Error updating offer background:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to update offer background',
    });
  }
};

const deleteOfferBackground = async (req, res) => {
  try {
    const storeName = getStoreName(req);
    const { backgroundId } = req.params;

    if (!toObjectId(backgroundId)) {
      return res.status(400).json({ success: false, message: 'Invalid background id' });
    }

    const removed = await removeOfferBackground({ storeName, backgroundId });

    if (!removed || removed.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Offer background not found' });
    }

    return res.json({ success: true, message: 'Offer background deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting offer background:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete offer background',
      error: error.message,
    });
  }
};

const getPublicCategorySections = async (req, res) => {
  try {
    const storeName = getStoreName(req);
    const data = await listPublicCategorySections(storeName);

    return res.json({ success: true, data });
  } catch (error) {
    console.error('❌ Error fetching public category section:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch category section',
      error: error.message,
    });
  }
};

const getAdminCategorySections = async (req, res) => {
  try {
    const storeName = getStoreName(req);
    const data = await listAdminCategorySections(storeName);

    return res.json({ success: true, data });
  } catch (error) {
    console.error('❌ Error fetching admin category section:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch category section settings',
      error: error.message,
    });
  }
};

const createCategorySection = async (req, res) => {
  try {
    const storeName = getStoreName(req);
    const { categoryId, imageUrl, isActive, displayOrder } = req.body || {};

    const data = await insertCategorySection({
      storeName,
      categoryId,
      imageUrl,
      isActive,
      displayOrder,
    });

    return res.status(201).json({
      success: true,
      message: 'Category section item created successfully',
      data,
    });
  } catch (error) {
    console.error('❌ Error creating category section:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to create category section item',
    });
  }
};

const updateCategorySection = async (req, res) => {
  try {
    const storeName = getStoreName(req);
    const { itemId } = req.params;

    if (!toObjectId(itemId)) {
      return res.status(400).json({ success: false, message: 'Invalid item id' });
    }

    const updated = await patchCategorySection({
      storeName,
      itemId,
      ...(req.body || {}),
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Category section item not found' });
    }

    return res.json({
      success: true,
      message: 'Category section item updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('❌ Error updating category section:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to update category section item',
    });
  }
};

const getPublicFeaturedCollections = async (req, res) => {
  try {
    const storeName = getStoreName(req);
    const data = await listPublicFeaturedCollections(storeName);

    return res.json({ success: true, data });
  } catch (error) {
    console.error('❌ Error fetching public featured collections:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch featured collections',
      error: error.message,
    });
  }
};

const getAdminFeaturedCollections = async (req, res) => {
  try {
    const storeName = getStoreName(req);
    const data = await listAdminFeaturedCollections(storeName);

    return res.json({ success: true, data });
  } catch (error) {
    console.error('❌ Error fetching admin featured collections:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch featured collections settings',
      error: error.message,
    });
  }
};

const createFeaturedCollection = async (req, res) => {
  try {
    const storeName = getStoreName(req);
    const data = await insertFeaturedCollection({
      storeName,
      ...(req.body || {}),
    });

    return res.status(201).json({
      success: true,
      message: 'Featured collection created successfully',
      data,
    });
  } catch (error) {
    console.error('❌ Error creating featured collection:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to create featured collection',
    });
  }
};

const updateFeaturedCollection = async (req, res) => {
  try {
    const storeName = getStoreName(req);
    const { itemId } = req.params;

    if (!toObjectId(itemId)) {
      return res.status(400).json({ success: false, message: 'Invalid item id' });
    }

    const updated = await patchFeaturedCollection({
      storeName,
      itemId,
      ...(req.body || {}),
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Featured collection not found' });
    }

    return res.json({
      success: true,
      message: 'Featured collection updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('❌ Error updating featured collection:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to update featured collection',
    });
  }
};

const getPublicFeaturedCollectionBackgrounds = async (req, res) => {
  try {
    const storeName = getStoreName(req);
    const data = await listPublicFeaturedCollectionBackgrounds(storeName);
    return res.json({ success: true, data });
  } catch (error) {
    console.error('❌ Error fetching public featured collection backgrounds:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch featured collection backgrounds', error: error.message });
  }
};

const getAdminFeaturedCollectionBackgrounds = async (req, res) => {
  try {
    const storeName = getStoreName(req);
    const data = await listAdminFeaturedCollectionBackgrounds(storeName);
    return res.json({ success: true, data });
  } catch (error) {
    console.error('❌ Error fetching admin featured collection backgrounds:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch featured collection backgrounds', error: error.message });
  }
};

const createFeaturedCollectionBackground = async (req, res) => {
  try {
    const storeName = getStoreName(req);
    const { title, imageUrl, isActive, displayOrder } = req.body || {};
    if (!imageUrl || !String(imageUrl).trim()) {
      return res.status(400).json({ success: false, message: 'imageUrl is required' });
    }
    const data = await insertFeaturedCollectionBackground({ storeName, title, imageUrl, isActive, displayOrder });
    return res.status(201).json({ success: true, message: 'Featured collections background created successfully', data });
  } catch (error) {
    console.error('❌ Error creating featured collection background:', error);
    return res.status(500).json({ success: false, message: 'Failed to create featured collection background', error: error.message });
  }
};

const updateFeaturedCollectionBackground = async (req, res) => {
  try {
    const storeName = getStoreName(req);
    const { backgroundId } = req.params;
    if (!toObjectId(backgroundId)) {
      return res.status(400).json({ success: false, message: 'Invalid background id' });
    }
    const updated = await patchFeaturedCollectionBackground({ storeName, backgroundId, ...(req.body || {}) });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Featured collection background not found' });
    }
    return res.json({ success: true, message: 'Featured collection background updated successfully', data: updated });
  } catch (error) {
    console.error('❌ Error updating featured collection background:', error);
    return res.status(400).json({ success: false, message: error.message || 'Failed to update featured collection background' });
  }
};

const deleteFeaturedCollectionBackground = async (req, res) => {
  try {
    const storeName = getStoreName(req);
    const { backgroundId } = req.params;
    if (!toObjectId(backgroundId)) {
      return res.status(400).json({ success: false, message: 'Invalid background id' });
    }
    const removed = await removeFeaturedCollectionBackground({ storeName, backgroundId });
    if (!removed || removed.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Featured collection background not found' });
    }
    return res.json({ success: true, message: 'Featured collection background deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting featured collection background:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete featured collection background', error: error.message });
  }
};

const getPublicGiftSection = async (req, res) => {
  try {
    const storeName = getStoreName(req);
    const data = await listPublicGiftBanners(storeName);
    return res.json({ success: true, data });
  } catch (error) {
    console.error('❌ Error fetching public gift section:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch gift section',
      error: error.message,
    });
  }
};

const getAdminGiftSection = async (req, res) => {
  try {
    const storeName = getStoreName(req);
    const data = await listAdminGiftBanners(storeName);
    return res.json({ success: true, data });
  } catch (error) {
    console.error('❌ Error fetching admin gift section:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch gift section settings',
      error: error.message,
    });
  }
};

const createGiftSection = async (req, res) => {
  try {
    const storeName = getStoreName(req);
    const data = await insertGiftBanner({
      storeName,
      ...(req.body || {}),
    });

    return res.status(201).json({
      success: true,
      message: 'Gift banner created successfully',
      data,
    });
  } catch (error) {
    console.error('❌ Error creating gift section banner:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to create gift banner',
    });
  }
};

const updateGiftSection = async (req, res) => {
  try {
    const storeName = getStoreName(req);
    const { itemId } = req.params;

    if (!toObjectId(itemId)) {
      return res.status(400).json({ success: false, message: 'Invalid item id' });
    }

    const updated = await patchGiftBanner({
      storeName,
      itemId,
      ...(req.body || {}),
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Gift banner not found' });
    }

    return res.json({
      success: true,
      message: 'Gift banner updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('❌ Error updating gift section banner:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to update gift banner',
    });
  }
};

const getPublicCareSection = async (req, res) => {
  try {
    const images = await listPublicCareImages(getStoreName(req));
    return res.json({ success: true, data: images });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getAdminCareSection = async (req, res) => {
  try {
    const images = await listAdminCareImages(getStoreName(req));
    return res.json({ success: true, data: images });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createCareImage = async (req, res) => {
  try {
    const item = await insertCareImage({ storeName: getStoreName(req), ...(req.body || {}) });
    return res.status(201).json({ success: true, data: item });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const updateCareImage = async (req, res) => {
  try {
    const updated = await patchCareImage({
      storeName: getStoreName(req),
      itemId: req.params.itemId,
      ...(req.body || {}),
    });
    if (!updated) return res.status(404).json({ success: false, message: 'Care image not found' });
    return res.json({ success: true, data: updated });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const getPublicStaticPage = async (req, res) => {
  try {
    const storeName = getStoreName(req);
    const { slug } = req.params;
    const data = await getPublicStaticPageBySlug({ storeName, slug });

    return res.json({ success: true, data: data || null });
  } catch (error) {
    const isInvalidSlug = /Invalid static page slug/i.test(error.message || '');
    return res.status(isInvalidSlug ? 400 : 500).json({
      success: false,
      message: isInvalidSlug ? 'Invalid static page slug' : 'Failed to fetch static page',
      error: error.message,
    });
  }
};

const getAdminStaticPages = async (req, res) => {
  try {
    const storeName = getStoreName(req);
    const data = await listAdminStaticPages(storeName);
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch static page settings',
      error: error.message,
    });
  }
};

const upsertAdminStaticPage = async (req, res) => {
  try {
    const storeName = getStoreName(req);
    const { slug } = req.params;
    const { title, content, isActive } = req.body || {};

    const data = await upsertStaticPage({
      storeName,
      slug,
      title,
      content,
      isActive,
    });

    return res.json({
      success: true,
      message: 'Static page updated successfully',
      data,
    });
  } catch (error) {
    const isInvalidSlug = /Invalid static page slug/i.test(error.message || '');
    return res.status(isInvalidSlug ? 400 : 500).json({
      success: false,
      message: isInvalidSlug ? 'Invalid static page slug' : 'Failed to update static page',
      error: error.message,
    });
  }
};

const getPublicFooterSettingsConfig = async (req, res) => {
  try {
    const storeName = getStoreName(req);
    const data = await getPublicFooterSettings(storeName);
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch footer settings',
      error: error.message,
    });
  }
};

const getAdminFooterSettingsConfig = async (req, res) => {
  try {
    const storeName = getStoreName(req);
    const data = await getAdminFooterSettings(storeName);
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch footer settings',
      error: error.message,
    });
  }
};

const updateAdminFooterSettingsConfig = async (req, res) => {
  try {
    const storeName = getStoreName(req);
    const data = await upsertFooterSettings({
      storeName,
      ...(req.body || {}),
    });
    return res.json({
      success: true,
      message: 'Footer settings updated successfully',
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update footer settings',
      error: error.message,
    });
  }
};

module.exports = {
  getPublicBanners,
  getAdminBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  reorderBanners,
  getPublicTopPicks,
  getAdminTopPicks,
  updateAdminTopPicks,
  getPublicOffers,
  getPublicOfferProducts,
  getAdminOffers,
  createOffer,
  updateOffer,
  deleteOffer,
  getPublicOfferBackgrounds,
  getAdminOfferBackgrounds,
  createOfferBackground,
  updateOfferBackground,
  deleteOfferBackground,
  getPublicCategorySections,
  getAdminCategorySections,
  createCategorySection,
  updateCategorySection,
  getPublicFeaturedCollections,
  getAdminFeaturedCollections,
  createFeaturedCollection,
  updateFeaturedCollection,
  getPublicFeaturedCollectionBackgrounds,
  getAdminFeaturedCollectionBackgrounds,
  createFeaturedCollectionBackground,
  updateFeaturedCollectionBackground,
  deleteFeaturedCollectionBackground,
  getPublicGiftSection,
  getAdminGiftSection,
  createGiftSection,
  updateGiftSection,
  getPublicCareSection,
  getAdminCareSection,
  createCareImage,
  updateCareImage,
  getPublicStaticPage,
  getAdminStaticPages,
  upsertAdminStaticPage,
  getPublicFooterSettingsConfig,
  getAdminFooterSettingsConfig,
  updateAdminFooterSettingsConfig,
};
