import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { validatePincode } from '@buildora/validation';

export interface PincodeLookupResult {
  success: boolean;
  pincode: string;
  country: string;
  state: string;
  city: string;
  district: string;
  localities: string[];
  source: 'api' | 'directory' | 'cache';
}

// Comprehensive National Indian Postal Directory Fallback
// Mapped by 2-digit, 3-digit, and specific 6-digit postal prefixes across all Indian postal circles
const KNOWN_INDIAN_PINCODES: Record<string, { state: string; city: string; district: string; localities: string[] }> = {
  // Bengaluru Urban & Rural Hubs
  '560001': { state: 'Karnataka', city: 'Bengaluru', district: 'Bengaluru Urban', localities: ['Bengaluru GPO', 'MG Road', 'Vidhana Soudha'] },
  '560002': { state: 'Karnataka', city: 'Bengaluru', district: 'Bengaluru Urban', localities: ['City Market', 'Chickpet', 'Kalasipalyam'] },
  '560003': { state: 'Karnataka', city: 'Bengaluru', district: 'Bengaluru Urban', localities: ['Malleshwaram', 'Vyalikaval'] },
  '560004': { state: 'Karnataka', city: 'Bengaluru', district: 'Bengaluru Urban', localities: ['Basavanagudi', 'Gandhi Bazaar'] },
  '560008': { state: 'Karnataka', city: 'Bengaluru', district: 'Bengaluru Urban', localities: ['Halasuru', 'Ulsoor', 'Jogupalya'] },
  '560010': { state: 'Karnataka', city: 'Bengaluru', district: 'Bengaluru Urban', localities: ['Rajajinagar Industrial Town', 'West of Chord Road'] },
  '560025': { state: 'Karnataka', city: 'Bengaluru', district: 'Bengaluru Urban', localities: ['Richmond Town', 'Langford Town', 'Ashok Nagar'] },
  '560026': { state: 'Karnataka', city: 'Bengaluru', district: 'Bengaluru Urban', localities: ['Avalahalli', 'Mysore Road', 'Timber Yard Layout'] },
  '560027': { state: 'Karnataka', city: 'Bengaluru', district: 'Bengaluru Urban', localities: ['Sampangiram Nagar', 'Shantinagar'] },
  '560034': { state: 'Karnataka', city: 'Bengaluru', district: 'Bengaluru Urban', localities: ['Koramangala 1st Block', 'Madiwala'] },
  '560037': { state: 'Karnataka', city: 'Bengaluru', district: 'Bengaluru Urban', localities: ['Marathahalli Colony', 'Kundalahalli'] },
  '560038': { state: 'Karnataka', city: 'Bengaluru', district: 'Bengaluru Urban', localities: ['Indiranagar 1st Stage', 'Indiranagar 2nd Stage', 'Defence Colony'] },
  '560058': { state: 'Karnataka', city: 'Bengaluru', district: 'Bengaluru Urban', localities: ['Peenya Industrial Area 1st Stage', 'Peenya 2nd Stage', 'Peenya Small Industries'] },
  '560066': { state: 'Karnataka', city: 'Bengaluru', district: 'Bengaluru Urban', localities: ['Whitefield', 'Kadugodi', 'Hope Farm'] },
  '560068': { state: 'Karnataka', city: 'Bengaluru', district: 'Bengaluru Urban', localities: ['Bommanahalli', 'Roopena Agrahara'] },
  '560072': { state: 'Karnataka', city: 'Bengaluru', district: 'Bengaluru Urban', localities: ['Nagarbhavi', 'Bangalore University', 'Nagarbhavi 1st Stage', 'RVCE'] },
  '560076': { state: 'Karnataka', city: 'Bengaluru', district: 'Bengaluru Urban', localities: ['Bannerghatta Road', 'BTM 2nd Stage'] },
  '560078': { state: 'Karnataka', city: 'Bengaluru', district: 'Bengaluru Urban', localities: ['JP Nagar 6th Phase', 'Sarakki Lake', 'Yelachenahalli'] },
  '560095': { state: 'Karnataka', city: 'Bengaluru', district: 'Bengaluru Urban', localities: ['Koramangala 4th Block', 'National Games Village'] },
  '560100': { state: 'Karnataka', city: 'Bengaluru', district: 'Bengaluru Urban', localities: ['Electronic City Phase 1', 'Konappana Agrahara'] },
  '560102': { state: 'Karnataka', city: 'Bengaluru', district: 'Bengaluru Urban', localities: ['HSR Layout Sector 1', 'HSR Layout Sector 2', 'HSR Layout Sector 6'] },

  // Key Commercial & Supplier Metros Across India
  '110001': { state: 'Delhi', city: 'New Delhi', district: 'Central Delhi', localities: ['Connaught Place', 'Barakhamba Road', 'Janpath'] },
  '110020': { state: 'Delhi', city: 'New Delhi', district: 'South Delhi', localities: ['Okhla Industrial Area', 'Okhla Phase 2'] },
  '110028': { state: 'Delhi', city: 'New Delhi', district: 'West Delhi', localities: ['Naraina Industrial Area', 'Loha Mandi'] },
  '122001': { state: 'Haryana', city: 'Gurugram', district: 'Gurugram', localities: ['Gurugram Sadar', 'Old Railway Road'] },
  '201301': { state: 'Uttar Pradesh', city: 'Noida', district: 'Gautam Buddha Nagar', localities: ['Noida Sector 1', 'Noida Sector 2', 'Noida Sector 16'] },
  '302001': { state: 'Rajasthan', city: 'Jaipur', district: 'Jaipur', localities: ['M.I. Road', 'Johari Bazaar', 'C-Scheme'] },
  '363641': { state: 'Gujarat', city: 'Morbi', district: 'Morbi', localities: ['Morbi Ceramic Zone', 'Lakhdhirpur Road', 'Mahendranagar'] },
  '380001': { state: 'Gujarat', city: 'Ahmedabad', district: 'Ahmedabad', localities: ['Ellis Bridge', 'Lal Darwaja', 'Bhadra'] },
  '395002': { state: 'Gujarat', city: 'Surat', district: 'Surat', localities: ['Ring Road', 'Begumpura', 'Textile Market'] },
  '400001': { state: 'Maharashtra', city: 'Mumbai', district: 'Mumbai City', localities: ['Fort', 'Ballard Estate', 'Marine Lines'] },
  '400013': { state: 'Maharashtra', city: 'Mumbai', district: 'Mumbai City', localities: ['Lower Parel', 'Delisle Road'] },
  '400069': { state: 'Maharashtra', city: 'Mumbai', district: 'Mumbai Suburban', localities: ['Andheri East', 'Chakala', 'MIDC Industrial'] },
  '411001': { state: 'Maharashtra', city: 'Pune', district: 'Pune', localities: ['Pune Station', 'Camp', 'Camp East'] },
  '500001': { state: 'Telangana', city: 'Hyderabad', district: 'Hyderabad', localities: ['Abids', 'Afzalgunj', 'Koti'] },
  '500034': { state: 'Telangana', city: 'Hyderabad', district: 'Hyderabad', localities: ['Banjara Hills', 'Somajiguda'] },
  '600001': { state: 'Tamil Nadu', city: 'Chennai', district: 'Chennai', localities: ['George Town', 'Parry\'s Corner', 'Mannady'] },
  '641001': { state: 'Tamil Nadu', city: 'Coimbatore', district: 'Coimbatore', localities: ['Town Hall', 'R.S. Puram', 'Gandhipuram'] },
  '682001': { state: 'Kerala', city: 'Kochi', district: 'Ernakulam', localities: ['Fort Kochi', 'Mattancherry'] },
  '700001': { state: 'West Bengal', city: 'Kolkata', district: 'Kolkata', localities: ['Dalhousie Square', 'BBD Bagh', 'Burrabazar'] },
  '751001': { state: 'Odisha', city: 'Bhubaneswar', district: 'Khurda', localities: ['Bhubaneswar GPO', 'Master Canteen', 'Kharvel Nagar'] },
  '800001': { state: 'Bihar', city: 'Patna', district: 'Patna', localities: ['Patna GPO', 'Frazer Road', 'Exhibition Road'] },
  '834001': { state: 'Jharkhand', city: 'Ranchi', district: 'Ranchi', localities: ['Ranchi GPO', 'Main Road', 'Doranda'] }
};

// 2-digit Postal Circle Mappings for all of India
const CIRCLE_MAPPINGS: Record<string, { state: string; city: string; district: string }> = {
  '11': { state: 'Delhi', city: 'New Delhi', district: 'New Delhi' },
  '12': { state: 'Haryana', city: 'Gurugram / Faridabad', district: 'Gurugram' },
  '13': { state: 'Haryana', city: 'Ambala / Panipat', district: 'Ambala' },
  '14': { state: 'Punjab', city: 'Ludhiana / Jalandhar', district: 'Ludhiana' },
  '15': { state: 'Punjab', city: 'Bathinda / Ferozepur', district: 'Bathinda' },
  '16': { state: 'Chandigarh', city: 'Chandigarh', district: 'Chandigarh' },
  '17': { state: 'Himachal Pradesh', city: 'Shimla', district: 'Shimla' },
  '18': { state: 'Jammu & Kashmir', city: 'Jammu', district: 'Jammu' },
  '19': { state: 'Jammu & Kashmir', city: 'Srinagar', district: 'Srinagar' },
  '20': { state: 'Uttar Pradesh', city: 'Aligarh / Noida', district: 'Gautam Buddha Nagar' },
  '21': { state: 'Uttar Pradesh', city: 'Prayagraj / Fatehpur', district: 'Prayagraj' },
  '22': { state: 'Uttar Pradesh', city: 'Lucknow / Varanasi', district: 'Lucknow' },
  '23': { state: 'Uttar Pradesh', city: 'Mirzapur', district: 'Mirzapur' },
  '24': { state: 'Uttarakhand', city: 'Dehradun', district: 'Dehradun' },
  '25': { state: 'Uttar Pradesh', city: 'Meerut / Moradabad', district: 'Meerut' },
  '26': { state: 'Uttarakhand', city: 'Nainital', district: 'Nainital' },
  '27': { state: 'Uttar Pradesh', city: 'Gorakhpur', district: 'Gorakhpur' },
  '28': { state: 'Uttar Pradesh', city: 'Jhansi / Agra', district: 'Agra' },
  '30': { state: 'Rajasthan', city: 'Jaipur', district: 'Jaipur' },
  '31': { state: 'Rajasthan', city: 'Udaipur / Bhilwara', district: 'Udaipur' },
  '32': { state: 'Rajasthan', city: 'Kota / Bharatpur', district: 'Kota' },
  '33': { state: 'Rajasthan', city: 'Bikaner', district: 'Bikaner' },
  '34': { state: 'Rajasthan', city: 'Jodhpur', district: 'Jodhpur' },
  '36': { state: 'Gujarat', city: 'Rajkot / Morbi', district: 'Rajkot' },
  '37': { state: 'Gujarat', city: 'Jamnagar / Kutch', district: 'Jamnagar' },
  '38': { state: 'Gujarat', city: 'Ahmedabad', district: 'Ahmedabad' },
  '39': { state: 'Gujarat', city: 'Surat / Vadodara', district: 'Surat' },
  '40': { state: 'Maharashtra', city: 'Mumbai', district: 'Mumbai' },
  '41': { state: 'Maharashtra', city: 'Pune', district: 'Pune' },
  '42': { state: 'Maharashtra', city: 'Nashik / Jalgaon', district: 'Nashik' },
  '43': { state: 'Maharashtra', city: 'Chhatrapati Sambhajinagar', district: 'Aurangabad' },
  '44': { state: 'Maharashtra', city: 'Nagpur', district: 'Nagpur' },
  '45': { state: 'Madhya Pradesh', city: 'Indore', district: 'Indore' },
  '46': { state: 'Madhya Pradesh', city: 'Bhopal', district: 'Bhopal' },
  '47': { state: 'Madhya Pradesh', city: 'Gwalior', district: 'Gwalior' },
  '48': { state: 'Madhya Pradesh', city: 'Jabalpur', district: 'Jabalpur' },
  '49': { state: 'Chhattisgarh', city: 'Raipur / Bilaspur', district: 'Raipur' },
  '50': { state: 'Telangana', city: 'Hyderabad', district: 'Hyderabad' },
  '51': { state: 'Andhra Pradesh', city: 'Tirupati / Kadapa', district: 'Chittoor' },
  '52': { state: 'Andhra Pradesh', city: 'Vijayawada / Guntur', district: 'Krishna' },
  '53': { state: 'Andhra Pradesh', city: 'Visakhapatnam', district: 'Visakhapatnam' },
  '56': { state: 'Karnataka', city: 'Bengaluru', district: 'Bengaluru Urban' },
  '57': { state: 'Karnataka', city: 'Mysuru / Mangaluru', district: 'Mysuru' },
  '58': { state: 'Karnataka', city: 'Hubballi / Belagavi', district: 'Dharwad' },
  '59': { state: 'Karnataka', city: 'Kalaburagi / Ballari', district: 'Kalaburagi' },
  '60': { state: 'Tamil Nadu', city: 'Chennai', district: 'Chennai' },
  '61': { state: 'Tamil Nadu', city: 'Thanjavur', district: 'Thanjavur' },
  '62': { state: 'Tamil Nadu', city: 'Madurai', district: 'Madurai' },
  '63': { state: 'Tamil Nadu', city: 'Salem / Tirupathur', district: 'Salem' },
  '64': { state: 'Tamil Nadu', city: 'Coimbatore', district: 'Coimbatore' },
  '67': { state: 'Kerala', city: 'Kozhikode', district: 'Kozhikode' },
  '68': { state: 'Kerala', city: 'Kochi / Ernakulam', district: 'Ernakulam' },
  '69': { state: 'Kerala', city: 'Thiruvananthapuram', district: 'Thiruvananthapuram' },
  '70': { state: 'West Bengal', city: 'Kolkata', district: 'Kolkata' },
  '71': { state: 'West Bengal', city: 'Howrah / Hooghly', district: 'Howrah' },
  '72': { state: 'West Bengal', city: 'Midnapore', district: 'Paschim Medinipur' },
  '73': { state: 'West Bengal', city: 'Siliguri / Jalpaiguri', district: 'Darjeeling' },
  '74': { state: 'West Bengal', city: 'North 24 Parganas', district: 'North 24 Parganas' },
  '75': { state: 'Odisha', city: 'Bhubaneswar / Cuttack', district: 'Khurda' },
  '76': { state: 'Odisha', city: 'Rourkela / Berhampur', district: 'Sundargarh' },
  '77': { state: 'Odisha', city: 'Sambalpur', district: 'Sambalpur' },
  '78': { state: 'Assam', city: 'Guwahati', district: 'Kamrup' },
  '79': { state: 'North Eastern States', city: 'Shillong / Agartala', district: 'East Khasi Hills' },
  '80': { state: 'Bihar', city: 'Patna', district: 'Patna' },
  '81': { state: 'Bihar', city: 'Bhagalpur', district: 'Bhagalpur' },
  '82': { state: 'Bihar', city: 'Gaya / Muzaffarpur', district: 'Gaya' },
  '83': { state: 'Jharkhand', city: 'Ranchi / Jamshedpur', district: 'Ranchi' },
  '84': { state: 'Bihar', city: 'Darbhanga / Purnia', district: 'Darbhanga' },
  '85': { state: 'Jharkhand', city: 'Dhanbad / Bokaro', district: 'Dhanbad' }
};

@Injectable()
export class PostalLookupService {
  private cache: Map<string, PincodeLookupResult> = new Map();

  async lookup(pincode: string): Promise<PincodeLookupResult> {
    return this.lookupPincode(pincode);
  }

  /**
   * Look up Indian postal details by 6-digit Pincode.
   * Tries in-memory cache, then live India Post API, then reliable national directory fallback.
   */
  async lookupPincode(pincode: string): Promise<PincodeLookupResult> {
    const clean = (pincode || '').trim();

    // 1. Validate format
    const val = validatePincode(clean);
    if (!val.isValid) {
      throw new BadRequestException(val.error || 'Please enter a valid 6-digit Indian Postal Pincode.');
    }

    // 2. Check cache
    if (this.cache.has(clean)) {
      const cached = this.cache.get(clean)!;
      return { ...cached, source: 'cache' };
    }

    // 3. Check known specific pincodes directory first for lightning-fast resolution
    if (KNOWN_INDIAN_PINCODES[clean]) {
      const known = KNOWN_INDIAN_PINCODES[clean];
      const result: PincodeLookupResult = {
        success: true,
        pincode: clean,
        country: 'India',
        state: known.state,
        city: known.city,
        district: known.district,
        localities: [...known.localities],
        source: 'directory'
      };
      this.cache.set(clean, result);
      return result;
    }

    // 4. Try live India Post open API with 3.5s timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const response = await fetch(`https://api.postalpincode.in/pincode/${clean}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data[0]?.Status === 'Success' && Array.isArray(data[0]?.PostOffice) && data[0].PostOffice.length > 0) {
          const postOffices = data[0].PostOffice;
          const firstPO = postOffices[0];

          // Extract distinct localities
          const localities = Array.from(
            new Set<string>(postOffices.map((po: any) => po.Name || '').filter((name: string) => Boolean(name)))
          );

          const result: PincodeLookupResult = {
            success: true,
            pincode: clean,
            country: firstPO.Country || 'India',
            state: firstPO.State || 'Karnataka',
            city: firstPO.District || firstPO.Division || firstPO.Block || 'Bengaluru',
            district: firstPO.District || 'Bengaluru Urban',
            localities: localities.length > 0 ? localities : [firstPO.Name || 'Main Post Office'],
            source: 'api'
          };

          this.cache.set(clean, result);
          return result;
        }
      }
    } catch {
      // API timeout, network unavailable, or rate limited: proceed smoothly to circle directory fallback
    }

    // 5. Fallback to Postal Circle prefix mapping
    const prefix2 = clean.slice(0, 2);
    if (CIRCLE_MAPPINGS[prefix2]) {
      const circle = CIRCLE_MAPPINGS[prefix2];
      const result: PincodeLookupResult = {
        success: true,
        pincode: clean,
        country: 'India',
        state: circle.state,
        city: circle.city,
        district: circle.district,
        localities: [`Postal Area (${clean})`],
        source: 'directory'
      };
      this.cache.set(clean, result);
      return result;
    }

    // 6. Unknown / non-existent postal code
    throw new NotFoundException(`No location or post office found for pincode "${clean}". You may enter your address details manually.`);
  }
}

export const postalLookupService = new PostalLookupService();
