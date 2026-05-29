export interface Product {
  id: string;
  nama: string;
  kategori: string;
  hargaBeli: number;
  hargaJual: number;
  stok: number;
  stokMinimum: number;
  foto?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  jumlah: number;
  subtotal: number;
}

export interface TransactionItem {
  productId: string;
  nama: string;
  hargaBeli: number;
  hargaJual: number;
  jumlah: number;
  subtotal: number;
}

export type MetodePembayaran = 'tunai' | 'transfer' | 'qris' | 'hutang';

export interface Transaction {
  id: string;
  items: TransactionItem[];
  total: number;
  modal: number;
  keuntungan: number;
  metodePembayaran: MetodePembayaran;
  namaBank?: string;
  namaPelanggan?: string;
  jumlahBayar?: number;
  kembalian?: number;
  createdAt: string;
  namaKasir: string;
}

export interface Expense {
  id: string;
  keterangan: string;
  jumlah: number;
  kategori: string;
  tanggal: string;
}

export interface Debt {
  id: string;
  namaPelanggan: string;
  nomorWhatsapp?: string;
  jumlah: number;
  tanggal: string;
  transactionId?: string;
  sudahLunas: boolean;
  tanggalLunas?: string;
  catatan?: string;
}

export interface StockHistory {
  id: string;
  productId: string;
  namaProduct: string;
  jenis: 'masuk' | 'keluar';
  jumlah: number;
  stokSebelum: number;
  stokSesudah: number;
  catatan: string;
  tanggal: string;
}

export interface StoreSettings {
  namaWarung: string;
  logoUri?: string;
  qrisUri?: string;
  stokMinimumDefault: number;
  nomorWhatsapp: string;
  alamat?: string;
  instagram?: string;
}

export interface UserProfile {
  clerkId: string;
  namaLengkap: string;
  email: string;
  namaWarung: string;
  nomorWhatsapp: string;
  statusAkun: 'trial' | 'aktif' | 'expired';
  paket: 'basic' | 'pro';
  tanggalMulai: string;
  tanggalExpired: string;
}

export type ToastType = 'success' | 'error' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}
