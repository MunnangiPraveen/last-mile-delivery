import { prisma } from '@/lib/prisma';
import type { CreateOrderInput, RateCalculationResult, ZoneType } from '@/types';

/**
 * Rate Calculation Engine
 * 
 * Calculates delivery charges based on:
 * 1. Zone detection (pickup & drop pincodes)
 * 2. Volumetric weight calculation
 * 3. Billable weight determination
 * 4. Rate card lookup (B2B/B2C × Intra/Inter zone)
 * 5. COD surcharge application
 */

// Volumetric Weight = (L × B × H) / 5000
export function calculateVolumetricWeight(length: number, breadth: number, height: number): number {
  return (length * breadth * height) / 5000;
}

// Billable Weight = MAX(actual, volumetric)
export function getBillableWeight(actualWeight: number, volumetricWeight: number): number {
  return Math.max(actualWeight, volumetricWeight);
}

/**
 * Detect zone for a given pincode.
 * 1. Try to find an Area with matching pincode → return its Zone
 * 2. If no match, return the default zone
 * 3. If no default zone, return a fallback "Unknown" zone info
 */
export async function detectZone(pincode: string): Promise<{ id: string | null; name: string }> {
  // Try exact pincode match
  const area = await prisma.area.findUnique({
    where: { pincode },
    include: { zone: true },
  });

  if (area) {
    return { id: area.zone.id, name: area.zone.name };
  }

  // Fallback to default zone
  const defaultZone = await prisma.zone.findFirst({
    where: { isDefault: true },
  });

  if (defaultZone) {
    return { id: defaultZone.id, name: defaultZone.name };
  }

  // Ultimate fallback
  return { id: null, name: 'Default' };
}

/**
 * Calculate the full rate for a delivery order
 */
export async function calculateRate(input: CreateOrderInput): Promise<RateCalculationResult> {
  // Validate inputs
  if (input.actualWeight <= 0) {
    throw new Error('Actual weight must be greater than 0');
  }
  if (input.length <= 0 || input.breadth <= 0 || input.height <= 0) {
    throw new Error('Package dimensions must be greater than 0');
  }

  // 1. Detect zones
  const pickupZone = await detectZone(input.pickupPincode);
  const dropZone = await detectZone(input.dropPincode);

  // 2. Determine zone type
  const zoneType: ZoneType = (pickupZone.id && dropZone.id && pickupZone.id === dropZone.id)
    ? 'INTRA_ZONE'
    : 'INTER_ZONE';

  // 3. Calculate weights
  const volumetricWeight = calculateVolumetricWeight(input.length, input.breadth, input.height);
  const billableWeight = getBillableWeight(input.actualWeight, volumetricWeight);

  // 4. Build rate type key
  const rateType = `${input.orderType}_${zoneType}`;

  // 5. Look up rate card
  const rateCard = await prisma.rateCard.findFirst({
    where: {
      orderType: input.orderType,
      zoneType: zoneType,
      isActive: true,
    },
  });

  if (!rateCard) {
    throw new Error(`No active rate card found for ${input.orderType} ${zoneType}. Please contact admin to configure rates.`);
  }

  // 6. Calculate base charge
  const baseCharge = Math.max(rateCard.ratePerKg * billableWeight, rateCard.minCharge);

  // 7. Calculate COD surcharge
  let codSurcharge = 0;
  if (input.paymentType === 'COD') {
    const codConfig = await prisma.codCharge.findFirst({
      where: {
        orderType: input.orderType,
        isActive: true,
      },
    });
    if (codConfig) {
      codSurcharge = codConfig.surcharge;
    }
  }

  // 8. Total charge
  const totalCharge = baseCharge + codSurcharge;

  return {
    pickupZoneId: pickupZone.id,
    pickupZoneName: pickupZone.name,
    dropZoneId: dropZone.id,
    dropZoneName: dropZone.name,
    orderType: input.orderType,
    paymentType: input.paymentType,
    actualWeight: input.actualWeight,
    volumetricWeight: Math.round(volumetricWeight * 100) / 100,
    billableWeight: Math.round(billableWeight * 100) / 100,
    rateType,
    ratePerKg: rateCard.ratePerKg,
    baseCharge: Math.round(baseCharge * 100) / 100,
    codSurcharge: Math.round(codSurcharge * 100) / 100,
    totalCharge: Math.round(totalCharge * 100) / 100,
  };
}
