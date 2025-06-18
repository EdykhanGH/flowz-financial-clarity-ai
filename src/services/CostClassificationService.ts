
interface BusinessContext {
  category: string;
  description: string;
  businessModel: string;
  costCenters: string[];
  revenueStreams: string[];
}

interface ClassificationRule {
  keywords: string[];
  transactionTypes: string[];
  classifications: string[];
  businessCategories?: string[];
}

export class CostClassificationService {
  private static rules: ClassificationRule[] = [
    // Direct Cost Rules
    {
      keywords: ['raw material', 'materials', 'inventory', 'stock', 'product', 'manufacturing', 'production', 'direct labor', 'labor cost', 'wages', 'factory', 'assembly'],
      transactionTypes: ['Direct/Product Costs'],
      classifications: ['Direct Cost', 'Variable Cost']
    },
    {
      keywords: ['cogs', 'cost of goods', 'purchase', 'supplier', 'vendor payment', 'procurement'],
      transactionTypes: ['Direct/Product Costs'],
      classifications: ['Direct Cost', 'Variable Cost']
    },

    // Indirect Cost Rules
    {
      keywords: ['overhead', 'utilities', 'electricity', 'water', 'gas', 'maintenance', 'repair', 'cleaning', 'security', 'supervision'],
      transactionTypes: ['Indirect/Operational Costs'],
      classifications: ['Indirect Cost', 'Fixed Cost']
    },
    {
      keywords: ['facility', 'building', 'premises', 'workshop', 'office space', 'factory rent'],
      transactionTypes: ['Indirect/Operational Costs', 'Administrative Expenses'],
      classifications: ['Indirect Cost', 'Fixed Cost']
    },

    // Fixed Cost Rules
    {
      keywords: ['rent', 'lease', 'salary', 'salaries', 'insurance', 'license', 'permit', 'subscription', 'depreciation', 'amortization'],
      transactionTypes: ['Administrative Expenses', 'Indirect/Operational Costs'],
      classifications: ['Fixed Cost', 'Indirect Cost']
    },
    {
      keywords: ['loan payment', 'mortgage', 'interest', 'bank charges', 'legal fees', 'audit', 'accounting'],
      transactionTypes: ['Administrative Expenses'],
      classifications: ['Fixed Cost', 'Indirect Cost']
    },

    // Variable Cost Rules
    {
      keywords: ['commission', 'sales commission', 'shipping', 'delivery', 'transport', 'fuel', 'packaging', 'per unit', 'per piece'],
      transactionTypes: ['Direct/Product Costs', 'Indirect/Operational Costs'],
      classifications: ['Variable Cost', 'Direct Cost']
    },
    {
      keywords: ['marketing spend', 'advertising', 'promotion', 'campaign', 'per sale', 'performance bonus'],
      transactionTypes: ['Administrative Expenses', 'Indirect/Operational Costs'],
      classifications: ['Variable Cost', 'Indirect Cost']
    },

    // Mixed Cost Rules
    {
      keywords: ['telephone', 'phone', 'internet', 'mobile', 'communication', 'data plan', 'cloud service'],
      transactionTypes: ['Administrative Expenses', 'Indirect/Operational Costs'],
      classifications: ['Mixed Cost', 'Indirect Cost']
    },
    {
      keywords: ['vehicle', 'car', 'truck', 'fleet', 'transportation', 'travel'],
      transactionTypes: ['Administrative Expenses', 'Indirect/Operational Costs'],
      classifications: ['Mixed Cost', 'Indirect Cost']
    },

    // Revenue Classifications
    {
      keywords: ['sale', 'sales', 'revenue', 'income', 'payment received', 'customer payment', 'invoice'],
      transactionTypes: ['Sales Revenue'],
      classifications: []
    },
    {
      keywords: ['interest income', 'dividend', 'investment return', 'rental income', 'other income'],
      transactionTypes: ['Other Income'],
      classifications: []
    }
  ];

  private static businessSpecificRules: Record<string, ClassificationRule[]> = {
    'Manufacturing': [
      {
        keywords: ['machine', 'equipment', 'tool', 'spare parts', 'consumables'],
        transactionTypes: ['Direct/Product Costs'],
        classifications: ['Direct Cost', 'Variable Cost']
      }
    ],
    'Retail': [
      {
        keywords: ['store rent', 'shop', 'display', 'pos', 'cashier'],
        transactionTypes: ['Indirect/Operational Costs'],
        classifications: ['Indirect Cost', 'Fixed Cost']
      }
    ],
    'Service': [
      {
        keywords: ['consultant fee', 'professional service', 'expertise', 'consultation'],
        transactionTypes: ['Direct/Product Costs'],
        classifications: ['Direct Cost', 'Variable Cost']
      }
    ],
    'Technology': [
      {
        keywords: ['software', 'hosting', 'server', 'domain', 'api', 'cloud', 'development'],
        transactionTypes: ['Indirect/Operational Costs'],
        classifications: ['Indirect Cost', 'Mixed Cost']
      }
    ]
  };

  static classifyTransaction(
    description: string,
    transactionType: string,
    businessContext?: BusinessContext
  ): string[] {
    const desc = description.toLowerCase();
    const suggestions = new Set<string>();

    // Apply general rules
    for (const rule of this.rules) {
      if (rule.transactionTypes.includes(transactionType)) {
        const hasKeyword = rule.keywords.some(keyword => desc.includes(keyword));
        if (hasKeyword) {
          rule.classifications.forEach(classification => suggestions.add(classification));
        }
      }
    }

    // Apply business-specific rules if context is available
    if (businessContext) {
      const businessCategory = businessContext.category;
      const businessRules = this.businessSpecificRules[businessCategory] || [];
      
      for (const rule of businessRules) {
        if (rule.transactionTypes.includes(transactionType)) {
          const hasKeyword = rule.keywords.some(keyword => desc.includes(keyword));
          if (hasKeyword) {
            rule.classifications.forEach(classification => suggestions.add(classification));
          }
        }
      }

      // Check cost centers from business profile
      businessContext.costCenters?.forEach(center => {
        if (desc.includes(center.toLowerCase())) {
          if (transactionType === 'Direct/Product Costs') {
            suggestions.add('Direct Cost');
            suggestions.add('Variable Cost');
          } else {
            suggestions.add('Indirect Cost');
          }
        }
      });
    }

    // Default classifications based on transaction type if no specific rules match
    if (suggestions.size === 0) {
      switch (transactionType) {
        case 'Sales Revenue':
        case 'Other Income':
          // No cost classifications for revenue
          break;
        case 'Direct/Product Costs':
          suggestions.add('Direct Cost');
          suggestions.add('Variable Cost');
          break;
        case 'Indirect/Operational Costs':
          suggestions.add('Indirect Cost');
          suggestions.add('Fixed Cost');
          break;
        case 'Administrative Expenses':
          suggestions.add('Indirect Cost');
          suggestions.add('Fixed Cost');
          break;
      }
    }

    return Array.from(suggestions);
  }

  static getKeywordSuggestions(description: string): string[] {
    const desc = description.toLowerCase();
    const matchedKeywords: string[] = [];

    for (const rule of this.rules) {
      for (const keyword of rule.keywords) {
        if (desc.includes(keyword) && !matchedKeywords.includes(keyword)) {
          matchedKeywords.push(keyword);
        }
      }
    }

    return matchedKeywords;
  }
}
