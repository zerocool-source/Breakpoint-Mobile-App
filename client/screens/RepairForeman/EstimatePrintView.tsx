import React, { useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Share,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';

interface EstimateLineItem {
  sku: string;
  name: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  taxable: boolean;
}

interface EstimateData {
  estimateNumber: string;
  propertyName: string;
  propertyAddress?: string;
  estimateDate: string;
  expirationDate: string;
  description: string;
  lineItems: EstimateLineItem[];
  subtotal: number;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  woNumber?: string;
  techName?: string;
}

type PrintViewParams = {
  EstimatePrintView: {
    estimate: EstimateData;
  };
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const generateHtmlContent = (estimate: EstimateData) => {
  const lineItemsHtml = estimate.lineItems.map((item, idx) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${idx + 1}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        <strong>${item.name}</strong><br>
        <span style="color: #6b7280; font-size: 12px;">${item.sku}</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.description || '-'}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.rate)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.amount)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 40px;
          color: #1f2937;
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 2px solid #0078D4;
        }
        .company-info h1 {
          color: #0078D4;
          margin: 0 0 8px 0;
          font-size: 24px;
        }
        .company-info p {
          margin: 2px 0;
          color: #6b7280;
          font-size: 14px;
        }
        .estimate-number {
          text-align: right;
        }
        .estimate-number h2 {
          color: #0078D4;
          margin: 0;
          font-size: 18px;
        }
        .estimate-number p {
          margin: 4px 0;
          color: #6b7280;
          font-size: 14px;
        }
        .property-section {
          background: #f9fafb;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        .property-section h3 {
          margin: 0 0 12px 0;
          color: #374151;
          font-size: 14px;
          text-transform: uppercase;
        }
        .property-section p {
          margin: 4px 0;
          font-size: 16px;
        }
        .description-section {
          margin-bottom: 30px;
        }
        .description-section h3 {
          margin: 0 0 12px 0;
          color: #374151;
          font-size: 14px;
          text-transform: uppercase;
        }
        .description-section p {
          line-height: 1.6;
          color: #4b5563;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        th {
          background: #0078D4;
          color: white;
          padding: 12px;
          text-align: left;
          font-size: 12px;
          text-transform: uppercase;
        }
        th:last-child {
          text-align: right;
        }
        .totals {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          margin-bottom: 40px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          width: 300px;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .total-row.grand-total {
          border-bottom: 2px solid #0078D4;
          border-top: 2px solid #0078D4;
          font-weight: bold;
          font-size: 18px;
          color: #0078D4;
        }
        .footer {
          margin-top: 60px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }
        .signature-line {
          margin-top: 40px;
          padding-top: 10px;
          border-top: 1px solid #1f2937;
          width: 300px;
        }
        .signature-line p {
          margin: 4px 0;
          color: #6b7280;
          font-size: 12px;
        }
        @media print {
          body { padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-info">
          <h1>Breakpoint Commercial Pool Systems</h1>
          <p>Commercial Pool Service & Repair</p>
          <p>San Diego, CA</p>
          <p>License #123456</p>
        </div>
        <div class="estimate-number">
          <h2>ESTIMATE</h2>
          <p><strong>${estimate.estimateNumber}</strong></p>
          <p>Date: ${formatDate(estimate.estimateDate)}</p>
          <p>Valid Until: ${formatDate(estimate.expirationDate)}</p>
        </div>
      </div>

      <div class="property-section">
        <h3>Bill To</h3>
        <p><strong>${estimate.propertyName}</strong></p>
        ${estimate.propertyAddress ? `<p>${estimate.propertyAddress}</p>` : ''}
        ${estimate.woNumber ? `<p>Work Order: ${estimate.woNumber}</p>` : ''}
      </div>

      ${estimate.description ? `
        <div class="description-section">
          <h3>Scope of Work</h3>
          <p>${estimate.description.replace(/\n/g, '<br>')}</p>
        </div>
      ` : ''}

      <table>
        <thead>
          <tr>
            <th style="width: 40px;">#</th>
            <th style="width: 200px;">Product/Service</th>
            <th>Description</th>
            <th style="width: 60px; text-align: center;">Qty</th>
            <th style="width: 100px; text-align: right;">Rate</th>
            <th style="width: 100px; text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${lineItemsHtml}
        </tbody>
      </table>

      <div class="totals">
        <div class="total-row">
          <span>Subtotal</span>
          <span>${formatCurrency(estimate.subtotal)}</span>
        </div>
        ${estimate.discountAmount > 0 ? `
          <div class="total-row">
            <span>Discount ${estimate.discountType === 'percent' ? `(${estimate.discountValue}%)` : ''}</span>
            <span>-${formatCurrency(estimate.discountAmount)}</span>
          </div>
        ` : ''}
        <div class="total-row">
          <span>Tax (${estimate.taxRate}%)</span>
          <span>${formatCurrency(estimate.taxAmount)}</span>
        </div>
        <div class="total-row grand-total">
          <span>Total</span>
          <span>${formatCurrency(estimate.total)}</span>
        </div>
      </div>

      <div class="footer">
        <p><strong>Terms & Conditions:</strong></p>
        <p style="font-size: 12px; color: #6b7280;">
          This estimate is valid for 30 days from the date of issue. Prices are subject to change based on actual conditions found during work. 
          Payment is due upon completion unless otherwise agreed. All work is guaranteed per California pool service standards.
        </p>
        
        <div class="signature-line">
          <p>Customer Signature</p>
          <p>Date: _______________</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export default function EstimatePrintView() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<PrintViewParams, 'EstimatePrintView'>>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const estimate = route.params?.estimate;

  if (!estimate) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>No estimate data provided</ThemedText>
      </ThemedView>
    );
  }

  const handlePrint = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const html = generateHtmlContent(estimate);
      await Print.printAsync({ html });
    } catch (error) {
      console.error('Print error:', error);
    }
  };

  const handleSharePdf = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const html = generateHtmlContent(estimate);
      const { uri } = await Print.printToFileAsync({ html });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Share Estimate ${estimate.estimateNumber}`,
        });
      }
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleCopyText = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    const textContent = `
ESTIMATE ${estimate.estimateNumber}
Breakpoint Commercial Pool Systems
Date: ${formatDate(estimate.estimateDate)}
Valid Until: ${formatDate(estimate.expirationDate)}

BILL TO:
${estimate.propertyName}
${estimate.propertyAddress || ''}
${estimate.woNumber ? `Work Order: ${estimate.woNumber}` : ''}

SCOPE OF WORK:
${estimate.description || 'N/A'}

LINE ITEMS:
${estimate.lineItems.map((item, idx) => 
  `${idx + 1}. ${item.name} - Qty: ${item.quantity} x ${formatCurrency(item.rate)} = ${formatCurrency(item.amount)}`
).join('\n')}

TOTALS:
Subtotal: ${formatCurrency(estimate.subtotal)}
${estimate.discountAmount > 0 ? `Discount: -${formatCurrency(estimate.discountAmount)}` : ''}
Tax (${estimate.taxRate}%): ${formatCurrency(estimate.taxAmount)}
TOTAL: ${formatCurrency(estimate.total)}
    `.trim();

    try {
      await Share.share({ message: textContent });
    } catch (error) {
      console.error('Copy error:', error);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Print Preview</ThemedText>
        <View style={styles.headerActions}>
          <Pressable style={styles.actionIcon} onPress={handleCopyText}>
            <Feather name="copy" size={22} color={theme.text} />
          </Pressable>
          <Pressable style={styles.actionIcon} onPress={handleSharePdf}>
            <Feather name="share" size={22} color={theme.text} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.previewCard, { backgroundColor: '#fff' }]}>
          <View style={styles.companyHeader}>
            <View>
              <ThemedText style={styles.companyName}>Breakpoint Commercial Pool Systems</ThemedText>
              <ThemedText style={styles.companySubtitle}>Commercial Pool Service & Repair</ThemedText>
            </View>
            <View style={styles.estimateInfo}>
              <ThemedText style={[styles.estimateLabel, { color: BrandColors.azureBlue }]}>ESTIMATE</ThemedText>
              <ThemedText style={styles.estimateNumber}>{estimate.estimateNumber}</ThemedText>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoColumn}>
              <ThemedText style={styles.infoLabel}>Bill To</ThemedText>
              <ThemedText style={styles.infoValue}>{estimate.propertyName}</ThemedText>
            </View>
            <View style={styles.infoColumn}>
              <ThemedText style={styles.infoLabel}>Date</ThemedText>
              <ThemedText style={styles.infoValue}>{formatDate(estimate.estimateDate)}</ThemedText>
            </View>
          </View>

          {estimate.description ? (
            <View style={styles.scopeSection}>
              <ThemedText style={styles.sectionLabel}>Scope of Work</ThemedText>
              <ThemedText style={styles.scopeText}>{estimate.description}</ThemedText>
            </View>
          ) : null}

          <View style={styles.lineItemsSection}>
            <ThemedText style={styles.sectionLabel}>Line Items</ThemedText>
            {estimate.lineItems.map((item, idx) => (
              <View key={idx} style={styles.lineItem}>
                <View style={styles.lineItemLeft}>
                  <ThemedText style={styles.lineItemName}>{item.name}</ThemedText>
                  <ThemedText style={styles.lineItemSku}>{item.sku}</ThemedText>
                </View>
                <View style={styles.lineItemRight}>
                  <ThemedText style={styles.lineItemQty}>{item.quantity} x {formatCurrency(item.rate)}</ThemedText>
                  <ThemedText style={styles.lineItemAmount}>{formatCurrency(item.amount)}</ThemedText>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.totalsSection}>
            <View style={styles.totalRow}>
              <ThemedText style={styles.totalLabel}>Subtotal</ThemedText>
              <ThemedText style={styles.totalValue}>{formatCurrency(estimate.subtotal)}</ThemedText>
            </View>
            {estimate.discountAmount > 0 ? (
              <View style={styles.totalRow}>
                <ThemedText style={styles.totalLabel}>
                  Discount {estimate.discountType === 'percent' ? `(${estimate.discountValue}%)` : ''}
                </ThemedText>
                <ThemedText style={[styles.totalValue, { color: BrandColors.emerald }]}>
                  -{formatCurrency(estimate.discountAmount)}
                </ThemedText>
              </View>
            ) : null}
            <View style={styles.totalRow}>
              <ThemedText style={styles.totalLabel}>Tax ({estimate.taxRate}%)</ThemedText>
              <ThemedText style={styles.totalValue}>{formatCurrency(estimate.taxAmount)}</ThemedText>
            </View>
            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <ThemedText style={styles.grandTotalLabel}>Total</ThemedText>
              <ThemedText style={styles.grandTotalValue}>{formatCurrency(estimate.total)}</ThemedText>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.md }]}>
        <Pressable
          style={[styles.printButton, { backgroundColor: BrandColors.azureBlue }]}
          onPress={handlePrint}
        >
          <Feather name="printer" size={20} color="#fff" />
          <ThemedText style={styles.printButtonText}>Print / Save PDF</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  previewCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  companyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '700',
    color: BrandColors.azureBlue,
  },
  companySubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  estimateInfo: {
    alignItems: 'flex-end',
  },
  estimateLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  estimateNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 2,
  },
  divider: {
    height: 2,
    backgroundColor: BrandColors.azureBlue,
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  infoColumn: {},
  infoLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginTop: 2,
  },
  scopeSection: {
    backgroundColor: '#f9fafb',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  scopeText: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 20,
  },
  lineItemsSection: {
    marginBottom: Spacing.md,
  },
  lineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  lineItemLeft: {
    flex: 1,
  },
  lineItemName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1f2937',
  },
  lineItemSku: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  lineItemRight: {
    alignItems: 'flex-end',
  },
  lineItemQty: {
    fontSize: 11,
    color: '#6b7280',
  },
  lineItemAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
  },
  totalsSection: {
    paddingTop: Spacing.md,
    borderTopWidth: 2,
    borderTopColor: '#e5e7eb',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  totalLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  totalValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1f2937',
  },
  grandTotalRow: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 2,
    borderTopColor: BrandColors.azureBlue,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: BrandColors.azureBlue,
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: BrandColors.azureBlue,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  printButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  printButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
