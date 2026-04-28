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
} = require('../services/landing.service');

const getStoreName = (req) => req.storeName || 'plants in garden';

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
};
