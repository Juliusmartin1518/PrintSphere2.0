export interface DocumentPrintingParams {
  paperSize: string;
  paperType: string;
  copies: number;
  colorMode: string;
}

export interface TarpaulinPrintingParams {
  width: number;
  height: number;
  eyelets: number;
  rope: boolean;
  stand: boolean;
}

export interface LaminationParams {
  size: string;
  quantity: number;
}

type PaperSizeType = "A4" | "Letter" | "Long" | "A5";
type PaperType = "Standard" | "Glossy" | "Matte" | "High Quality";
type ColorMode = "Black & White" | "Color" | "Auto Detect";
type LaminationSize = "ID Size" | "Big ID" | "A4" | "Long" | "A5";

// Default pricing rules in case we can't get them from the server
export const defaultPricingRules = {
  document: {
    // Base rates for each page type (in PHP Peso)
    colorPageRate: 2.0, // Base rate for colored page (₱14.00)
    blackPageRate: 1.0, // Base rate for black page (₱7.00)

    // Paper type adds an additional cost per page
    paperTypes: {
      Standard: 0.0, // No additional cost
      Glossy: 1.0, // ₱1 extra per page
      Matte: 1.5, // ₱1.50 extra per page
      "High Quality": 2.0, // ₱2 extra per page
    },

    // These are kept for backwards compatibility
    paperSizes: {
      A4: 1.0,
      Letter: 1.05,
      Long: 1.2,
      A5: 0.7,
    },
    colorModes: {
      "Black & White": 1.0,
      Color: 2.0,
      "Auto Detect": 1.5,
    },
    basePrice: 8, // Legacy base price per page
  },
  tarpaulin: {
    basePrice: 25, // Base price per sq.ft
    eyelets: 10, // Price per eyelet
    rope: 50, // Price for rope
    stand: 200, // Price for stand
  },
  lamination: {
    sizes: {
      "ID Size": 1.0,
      "Big ID": 1.5,
      A4: 2.5,
      Long: 2.0,
      A5: 1.8,
    },
    basePrice: 25, // Base price per piece
  },
};

/**
 * Calculate price for document printing
 */
export function calculateDocumentPrintingPrice(
  params: DocumentPrintingParams,
  rules = defaultPricingRules.document,
  documentAnalysis?: { pageCount: number; colorPages: number; bwPages: number },
): { unitPrice: number; total: number; breakdown: Record<string, any> } {
  // Handle null or undefined values safely
  if (!params) {
    return { unitPrice: 0, total: 0, breakdown: {} };
  }

  const { paperSize, paperType, copies, colorMode } = params;

  // Make sure copies is a number
  const copiesCount = copies && !isNaN(Number(copies)) ? Number(copies) : 1;

  // Get paper type additional cost (defaults to 0 if not found)
  const paperTypeRate =
    paperType && rules.paperTypes[paperType as PaperType] !== undefined
      ? rules.paperTypes[paperType as PaperType]
      : 0.0;

  // If auto detect mode is selected and we have document analysis
  if (colorMode === "Auto Detect" && documentAnalysis) {
    // Get the number of color and black & white pages
    const colorPages = documentAnalysis.colorPages || 0;
    const bwPages = documentAnalysis.bwPages || 0;
    const totalPages = colorPages + bwPages;

    // Calculate cost for each page type (base rate + paper type surcharge)
    const colorPageRate = rules.colorPageRate + paperTypeRate;
    const blackPageRate = rules.blackPageRate + paperTypeRate;

    // Calculate total cost for each page type
    const colorPagesTotal = colorPages * colorPageRate;
    const bwPagesTotal = bwPages * blackPageRate;

    // Calculate total for one copy
    const totalPerCopy = colorPagesTotal + bwPagesTotal;

    // Final total based on number of copies
    const total = totalPerCopy * copiesCount;

    // Calculate average unit price per page
    const unitPrice = totalPages > 0 ? totalPerCopy / totalPages : 0;

    return {
      unitPrice,
      total,
      breakdown: {
        colorPages,
        bwPages,
        totalPages,
        colorPageRate,
        blackPageRate,
        colorPagesTotal,
        bwPagesTotal,
        totalPerCopy,
        copies: copiesCount,
      },
    };
  }
  // For Color or Black & White modes without document analysis
  else {
    // Determine the base rate based on the selected color mode
    let baseRate = 0;
    if (colorMode === "Color") {
      baseRate = rules.colorPageRate;
    } else if (colorMode === "Black & White") {
      baseRate = rules.blackPageRate;
    } else {
      // Fallback for Auto Detect without document analysis
      baseRate = (rules.colorPageRate + rules.blackPageRate) / 2;
    }

    // Add paper type surcharge
    const pageRate = baseRate + paperTypeRate;

    // We don't know the page count, so use a default of 1
    const totalPerCopy = pageRate;
    const total = totalPerCopy * copiesCount;

    return {
      unitPrice: pageRate,
      total,
      breakdown: {
        baseRate,
        paperTypeRate,
        pageRate,
        copies: copiesCount,
      },
    };
  }
}

/**
 * Calculate price for tarpaulin printing
 */
export function calculateTarpaulinPrintingPrice(
  params: TarpaulinPrintingParams,
  rules = defaultPricingRules.tarpaulin,
): { unitPrice: number; total: number; breakdown: Record<string, any> } {
  // Handle null or undefined values safely
  if (!params) {
    return { unitPrice: 0, total: 0, breakdown: {} };
  }

  const { width, height, eyelets, rope, stand } = params;

  // Calculate area in square feet with safety checks
  const safeWidth = width && !isNaN(Number(width)) ? Number(width) : 0;
  const safeHeight = height && !isNaN(Number(height)) ? Number(height) : 0;
  const area = safeWidth * safeHeight;

  // Calculate base price for tarpaulin
  const baseCost = area * rules.basePrice;

  // Calculate add-ons with safety checks
  const safeEyelets = eyelets && !isNaN(Number(eyelets)) ? Number(eyelets) : 0;
  const eyeletCost = safeEyelets * rules.eyelets;
  const ropeCost = rope ? rules.rope : 0;
  const standCost = stand ? rules.stand : 0;

  const total = baseCost + eyeletCost + ropeCost + standCost;

  return {
    unitPrice: baseCost, // Unit price is just the base tarp price without add-ons
    total,
    breakdown: {
      dimensions: `${safeWidth} × ${safeHeight} ft`,
      area,
      baseCost,
      eyeletCost,
      eyelets: safeEyelets,
      ropeCost,
      standCost,
    },
  };
}

/**
 * Calculate price for lamination
 */
export function calculateLaminationPrice(
  params: LaminationParams,
  rules = defaultPricingRules.lamination,
): { unitPrice: number; total: number; breakdown: Record<string, any> } {
  // Handle null or undefined values safely
  if (!params) {
    return { unitPrice: 0, total: 0, breakdown: {} };
  }

  const { size, quantity } = params;

  // Safely get size multiplier with fallback
  const sizeMultiplier =
    size && rules.sizes[size as LaminationSize] !== undefined
      ? rules.sizes[size as LaminationSize]
      : 1.0;

  // Make sure quantity is a number
  const safeQuantity =
    quantity && !isNaN(Number(quantity)) ? Number(quantity) : 1;

  const unitPrice = rules.basePrice * sizeMultiplier;
  const total = unitPrice * safeQuantity;

  return {
    unitPrice,
    total,
    breakdown: {
      basePrice: rules.basePrice,
      sizeMultiplier,
      quantity: safeQuantity,
    },
  };
}
