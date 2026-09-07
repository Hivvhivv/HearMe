import PublicNavbar from "../components/PublicNavbar";
import Footer from "../components/Footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FAF8FD]">
      <PublicNavbar />
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <span className="inline-block bg-[#F5EEFC] text-[#6F3FB5] text-xs font-semibold px-3 py-1.5 rounded-full mb-4">Tentang Kami</span>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Mengapa HearMe Hadir?</h1>
          <p className="text-gray-500 max-w-2xl mx-auto leading-relaxed">
            HearMe lahir dari kepedulian mendalam terhadap krisis kesehatan mental yang sering terabaikan di Indonesia.
            Kami percaya setiap orang berhak mendapatkan dukungan emosional yang mudah diakses.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: "💜", title: "Misi Kami", desc: "Membuat kesehatan mental dapat diakses oleh semua orang, tanpa stigma." },
            { icon: "🎯", title: "Visi Kami", desc: "Indonesia yang lebih sehat secara mental, sejalan dengan agenda pembangunan global." },
            { icon: "🌱", title: "Nilai Kami", desc: "Empati, keamanan, inklusivitas, dan inovasi berbasis bukti ilmiah." },
          ].map((item) => (
            <div key={item.title} className="bg-white rounded-2xl p-6 border border-purple-50 text-center">
              <div className="text-4xl mb-3">{item.icon}</div>
              <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl p-8 border border-purple-50">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Tentang Aplikasi</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            HearMe adalah aplikasi yang mendukung pengguna dalam mengelola kesehatan mental melalui fitur seperti pelacak suasana hati (mood tracker), jurnal digital, dan perpustakaan konten perawatan diri (self-care library).
          </p>
          <p className="text-gray-600 leading-relaxed">
            Aplikasi ini bukan hanya inovasi dalam teknologi kesehatan (health-tech), tetapi juga langkah strategis untuk mencapai masyarakat Indonesia yang lebih sehat secara mental, sesuai dengan agenda pembangunan global.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
