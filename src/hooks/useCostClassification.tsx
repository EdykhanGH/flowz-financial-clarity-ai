
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { costClassificationService, CostClassification } from '@/services/CostClassificationService';

export const useCostClassification = () => {
  const { user } = useAuth();
  const [isClassifying, setIsClassifying] = useState(false);

  // Classify a single transaction
  const classifyTransaction = async (
    transactionId: string,
    description: string,
    amount: number,
    category: string
  ): Promise<CostClassification | null> => {
    if (!user) return null;

    setIsClassifying(true);
    try {
      const classification = await costClassificationService.classifyTransaction(
        description,
        amount,
        category,
        user.id
      );

      // Save the classification
      await costClassificationService.saveClassification(
        transactionId,
        user.id,
        classification
      );

      return classification;
    } catch (error) {
      console.error('Error classifying transaction:', error);
      return null;
    } finally {
      setIsClassifying(false);
    }
  };

  // Get existing classification
  const getClassification = async (transactionId: string): Promise<CostClassification | null> => {
    try {
      return await costClassificationService.getClassification(transactionId);
    } catch (error) {
      console.error('Error getting classification:', error);
      return null;
    }
  };

  // Add custom classification rule
  const addCustomRule = async (
    keyword: string,
    costType: 'fixed' | 'variable' | 'mixed',
    costNature: 'direct' | 'indirect',
    confidence: number = 0.8
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      // Get user's business category
      const businessProfile = await costClassificationService.getBusinessProfile(user.id);
      const businessCategory = businessProfile?.category || 'General';

      return await costClassificationService.addCustomRule(
        user.id,
        businessCategory,
        keyword,
        costType,
        costNature,
        confidence
      );
    } catch (error) {
      console.error('Error adding custom rule:', error);
      return false;
    }
  };

  // Bulk classify transactions
  const classifyTransactions = async (transactions: Array<{
    id: string;
    description: string;
    amount: number;
    category: string;
  }>): Promise<void> => {
    if (!user || transactions.length === 0) return;

    setIsClassifying(true);
    try {
      const promises = transactions.map(async (transaction) => {
        const existingClassification = await costClassificationService.getClassification(transaction.id);
        
        // Only classify if not already classified
        if (!existingClassification) {
          const classification = await costClassificationService.classifyTransaction(
            transaction.description,
            transaction.amount,
            transaction.category,
            user.id
          );

          await costClassificationService.saveClassification(
            transaction.id,
            user.id,
            classification
          );
        }
      });

      await Promise.all(promises);
    } catch (error) {
      console.error('Error in bulk classification:', error);
    } finally {
      setIsClassifying(false);
    }
  };

  return {
    classifyTransaction,
    getClassification,
    addCustomRule,
    classifyTransactions,
    isClassifying
  };
};
