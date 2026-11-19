import type { en } from './en';

// Missing keys fall back to English, so this can grow screen by screen.
export const hi: Partial<Record<keyof typeof en, string>> = {
  'common.loading': 'लोड हो रहा है...',
  'common.retry': 'फिर कोशिश करें',
  'common.error': 'कुछ गड़बड़ हो गई',
  'common.back': 'वापस',
  'common.cancel': 'रद्द करें',
  'common.save': 'सेव करें',
  'common.continue': 'आगे बढ़ें',
  'common.demoMode': 'डेमो मोड',

  'nav.home': 'होम',
  'nav.search': 'खोजें',
  'nav.bookings': 'बुकिंग',
  'nav.alerts': 'सूचनाएं',
  'nav.earnings': 'कमाई',
  'nav.id': 'मेरा ID',
  'nav.reviews': 'रिव्यू',
  'nav.overview': 'ओवरव्यू',
  'nav.verify': 'जांच',
  'nav.users': 'यूज़र',
  'nav.jobs': 'काम',

  'shell.notifications': 'सूचनाएं',
  'shell.signOut': 'साइन आउट',
  'shell.language': 'भाषा बदलें',

  'customer.greeting': 'नमस्ते, {name}',
  'customer.whereTitle': 'आपको कहां कारीगर चाहिए?',
  'customer.useMyLocation': 'मेरी लोकेशन इस्तेमाल करें',
  'customer.dragPin': 'सही जगह पर पिन खींचें',
  'customer.locating': 'आपकी लोकेशन ढूंढ रहे हैं...',
  'customer.denied': 'लोकेशन की अनुमति नहीं मिली। नक्शे पर पिन खुद लगाएं।',
  'customer.pickTrade': 'आपको क्या चाहिए?',
  'customer.emergencyTitle': 'अभी कारीगर चाहिए',
  'customer.emergencySub': 'आसपास के कारीगरों के पास स्वीकार करने के लिए 45 सेकंड होते हैं',

  'notifications.title': 'सूचनाएं',
  'notifications.markAll': 'सभी को पढ़ा हुआ करें',
  'notifications.empty': 'अभी कोई सूचना नहीं',
  'notifications.emptyText': 'बुकिंग अपडेट और रिव्यू यहां दिखेंगे।',

  'ui.available': 'अभी उपलब्ध',
  'ui.verified': 'वेरिफाइड',
  'ui.trust': 'ट्रस्ट स्कोर',
  'ui.emptyTitle': 'यहां अभी कुछ नहीं है',

  'trade.mason': 'राजमिस्त्री',
  'trade.electrician': 'इलेक्ट्रीशियन',
  'trade.plumber': 'प्लंबर',
  'trade.carpenter': 'बढ़ई',
  'trade.painter': 'पेंटर',
  'trade.construction_labour': 'मज़दूर',
  'trade.cleaner': 'सफ़ाई कर्मी',
  'trade.repair_technician': 'मरम्मत तकनीशियन',
};
