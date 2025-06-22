import { supabase } from '@/integrations/supabase/client';

export interface BusinessProfile {
  category: string;
  business_model: string;
  core_activities: string[];
  revenue_streams: string[];
  cost_centers: string[];
  business_size_scale: string;
  annual_revenue_range: string;
}

export interface CostClassification {
  cost_type: 'fixed' | 'variable' | 'mixed';
  cost_nature: 'direct' | 'indirect';
  confidence: number;
  reasoning?: string;
}

export interface CostPattern {
  pattern_name: string;
  business_category: string;
  cost_keywords: string[];
  typical_cost_type: 'fixed' | 'variable' | 'mixed';
  typical_cost_nature: 'direct' | 'indirect';
  industry_relevance: number;
}

export class CostClassificationService {
  
  // Get business profile for a user
  async getBusinessProfile(userId: string): Promise<BusinessProfile | null> {
    const { data, error } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      console.error('Error fetching business profile:', error);
      return null;
    }

    return {
      category: data.category || '',
      business_model: data.business_model || '',
      core_activities: data.core_activities || [],
      revenue_streams: data.revenue_streams || [],
      cost_centers: data.cost_centers || [],
      business_size_scale: data.business_size_scale || '',
      annual_revenue_range: data.annual_revenue_range || ''
    };
  }

  // Get relevant cost patterns based on business category
  async getCostPatterns(businessCategory: string): Promise<CostPattern[]> {
    const { data, error } = await supabase
      .from('business_cost_patterns')
      .select('*')
      .or(`business_category.eq.${businessCategory},business_category.eq.General`)
      .order('industry_relevance', { ascending: false });

    if (error) {
      console.error('Error fetching cost patterns:', error);
      return [];
    }

    // Cast the database types to our interface types
    return (data || []).map(pattern => ({
      pattern_name: pattern.pattern_name,
      business_category: pattern.business_category,
      cost_keywords: pattern.cost_keywords,
      typical_cost_type: pattern.typical_cost_type as 'fixed' | 'variable' | 'mixed',
      typical_cost_nature: pattern.typical_cost_nature as 'direct' | 'indirect',
      industry_relevance: pattern.industry_relevance || 1.0
    }));
  }

  // Main AI classification function
  async classifyTransaction(
    description: string,
    amount: number,
    category: string,
    userId: string
  ): Promise<CostClassification> {
    try {
      // Get business profile
      const businessProfile = await this.getBusinessProfile(userId);
      if (!businessProfile) {
        return this.getDefaultClassification(description, category);
      }

      // Get relevant cost patterns
      const costPatterns = await this.getCostPatterns(businessProfile.category);

      // Analyze the transaction
      const classification = this.analyzeTransaction(
        description,
        amount,
        category,
        businessProfile,
        costPatterns
      );

      return classification;
    } catch (error) {
      console.error('Error in cost classification:', error);
      return this.getDefaultClassification(description, category);
    }
  }

  // Core classification logic
  private analyzeTransaction(
    description: string,
    amount: number,
    category: string,
    businessProfile: BusinessProfile,
    costPatterns: CostPattern[]
  ): CostClassification {
    const descriptionLower = description.toLowerCase();
    const categoryLower = category.toLowerCase();
    
    let bestMatch: CostPattern | null = null;
    let highestScore = 0;

    // Find the best matching pattern
    for (const pattern of costPatterns) {
      let score = 0;
      
      // Keyword matching
      for (const keyword of pattern.cost_keywords) {
        if (descriptionLower.includes(keyword.toLowerCase()) || 
            categoryLower.includes(keyword.toLowerCase())) {
          score += pattern.industry_relevance;
        }
      }

      if (score > highestScore) {
        highestScore = score;
        bestMatch = pattern;
      }
    }

    // If we found a good match, use it
    if (bestMatch && highestScore > 0.5) {
      return {
        cost_type: bestMatch.typical_cost_type,
        cost_nature: bestMatch.typical_cost_nature,
        confidence: Math.min(highestScore, 0.95),
        reasoning: `Matched pattern: ${bestMatch.pattern_name}`
      };
    }

    // Apply business-specific rules
    return this.applyBusinessRules(description, amount, category, businessProfile);
  }

  // Business-specific classification rules
  private applyBusinessRules(
    description: string,
    amount: number,
    category: string,
    businessProfile: BusinessProfile
  ): CostClassification {
    const descriptionLower = description.toLowerCase();
    const categoryLower = category.toLowerCase();

    // Revenue-related costs are typically direct
    const isRevenueDirect = businessProfile.revenue_streams.some(stream =>
      descriptionLower.includes(stream.toLowerCase())
    );

    // Core activity costs are typically direct
    const isCoreActivityDirect = businessProfile.core_activities?.some(activity =>
      descriptionLower.includes(activity.toLowerCase())
    );

    // Cost center classification
    const isFromCostCenter = businessProfile.cost_centers?.some(center =>
      descriptionLower.includes(center.toLowerCase())
    );

    // Default classification logic
    let cost_type: 'fixed' | 'variable' | 'mixed' = 'variable';
    let cost_nature: 'direct' | 'indirect' = 'indirect';
    let confidence = 0.6;

    // Fixed cost indicators
    const fixedIndicators = ['rent', 'insurance', 'salary', 'subscription', 'license', 'depreciation'];
    if (fixedIndicators.some(indicator => descriptionLower.includes(indicator))) {
      cost_type = 'fixed';
      confidence += 0.2;
    }

    // Variable cost indicators
    const variableIndicators = ['materials', 'inventory', 'shipping', 'commission', 'per unit'];
    if (variableIndicators.some(indicator => descriptionLower.includes(indicator))) {
      cost_type = 'variable';
      confidence += 0.2;
    }

    // Direct cost determination
    if (isRevenueDirect || isCoreActivityDirect) {
      cost_nature = 'direct';
      confidence += 0.15;
    }

    // Manufacturing business rules
    if (businessProfile.category.includes('Manufacturing')) {
      if (descriptionLower.includes('material') || descriptionLower.includes('labor')) {
        cost_nature = 'direct';
        cost_type = 'variable';
        confidence += 0.2;
      }
    }

    // Service business rules
    if (businessProfile.category.includes('Services')) {
      if (descriptionLower.includes('consultant') || descriptionLower.includes('professional')) {
        cost_nature = 'direct';
        cost_type = 'variable';
        confidence += 0.2;
      }
    }

    return {
      cost_type,
      cost_nature,
      confidence: Math.min(confidence, 0.9),
      reasoning: 'Applied business-specific rules'
    };
  }

  // Fallback classification
  private getDefaultClassification(description: string, category: string): CostClassification {
    const descriptionLower = description.toLowerCase();
    
    // Simple keyword-based classification
    const fixedKeywords = ['rent', 'insurance', 'salary', 'subscription'];
    const directKeywords = ['material', 'inventory', 'labor', 'product'];
    
    const isFixed = fixedKeywords.some(keyword => descriptionLower.includes(keyword));
    const isDirect = directKeywords.some(keyword => descriptionLower.includes(keyword));
    
    return {
      cost_type: isFixed ? 'fixed' : 'variable',
      cost_nature: isDirect ? 'direct' : 'indirect',
      confidence: 0.5,
      reasoning: 'Default classification - limited business context'
    };
  }

  // Save classification to database
  async saveClassification(
    transactionId: string,
    userId: string,
    classification: CostClassification
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('transaction_classifications')
        .upsert({
          transaction_id: transactionId,
          user_id: userId,
          cost_type: classification.cost_type,
          cost_nature: classification.cost_nature,
          ai_confidence: classification.confidence,
          manual_override: false
        });

      if (error) {
        console.error('Error saving classification:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in saveClassification:', error);
      return false;
    }
  }

  // Get existing classification
  async getClassification(transactionId: string): Promise<CostClassification | null> {
    try {
      const { data, error } = await supabase
        .from('transaction_classifications')
        .select('*')
        .eq('transaction_id', transactionId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        cost_type: data.cost_type as 'fixed' | 'variable' | 'mixed',
        cost_nature: data.cost_nature as 'direct' | 'indirect',
        confidence: data.ai_confidence || 0,
        reasoning: data.manual_override ? 'Manual override' : 'AI classification'
      };
    } catch (error) {
      console.error('Error getting classification:', error);
      return null;
    }
  }

  // Update user's custom classification rules
  async addCustomRule(
    userId: string,
    businessCategory: string,
    keyword: string,
    costType: 'fixed' | 'variable' | 'mixed',
    costNature: 'direct' | 'indirect',
    confidence: number = 0.8
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('cost_classification_rules')
        .insert({
          user_id: userId,
          business_category: businessCategory,
          cost_keyword: keyword,
          cost_type: costType,
          cost_nature: costNature,
          confidence_score: confidence
        });

      if (error) {
        console.error('Error adding custom rule:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in addCustomRule:', error);
      return false;
    }
  }
}

export const costClassificationService = new CostClassificationService();
