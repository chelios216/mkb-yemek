'use client'

import { QRCodeSVG } from 'qrcode.react'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function StaticQRPage() {
  const [qrContent, setQrContent] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setQrContent(`${window.location.origin}/meal-check`)
  }, [])
  
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Screen controls */}
      <div className="no-print p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Sabit QR Kod Üretici</h1>
          <p className="text-gray-600 mb-4">
            Bu QR kodu yazdırıp mutfağa yapıştırabilirsiniz. Personel bu kodu okutarak yemek alabilir.
          </p>
          
          <button
            onClick={handlePrint}
            className="mb-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🖨️ Yazdır
          </button>
        </div>
      </div>

      {/* Print area */}
      <div className="print-area">
        <div className="max-w-2xl mx-auto p-8 text-center">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              MALKAN KANAAT
            </h1>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Yemek Sistemi
            </h2>
            <p className="text-lg text-gray-600">
              QR kodu okutarak yemek alın
            </p>
          </div>

          {/* QR Code */}
          <div className="mb-6">
            <div className="inline-block p-6 bg-white border-4 border-gray-800 rounded-lg">
              {mounted && qrContent ? (
                <QRCodeSVG
                  value={qrContent}
                  size={300}
                  level="H"
                  includeMargin={true}
                />
              ) : (
                <div className="w-[300px] h-[300px] bg-gray-200 flex items-center justify-center">
                  Yükleniyor...
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="mb-6">
            <h3 className="text-xl font-bold mb-3">📱 Nasıl Kullanılır?</h3>
            <div className="text-left max-w-md mx-auto space-y-2">
              <p className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-bold">1</span>
                Telefonunuzun kamera veya QR okuyucu uygulaması ile kodu okutun
              </p>
              <p className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-bold">2</span>
                İlk kullanımda telefon bilgileriniz kaydedilecek
              </p>
              <p className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-bold">3</span>
                Yemek saatlerinde (07:00-10:30 / 11:30-14:30) yemeğinizi alın
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-sm text-gray-500 border-t pt-4">
            <p><strong>Kahvaltı Saati:</strong> 07:00 - 10:30</p>
            <p><strong>Öğle Saati:</strong> 11:30 - 14:30</p>
            <p className="mt-2">Teknik destek için IT departmanına başvurun</p>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-10">
        <div className="flex justify-around py-2">
          <Link 
            href="/"
            className="flex flex-col items-center justify-end gap-1 text-gray-600 py-2 hover:text-green-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <p className="text-xs font-medium">Ana Sayfa</p>
          </Link>
          
          <Link 
            href="/scan"
            className="flex flex-col items-center justify-end gap-1 text-gray-600 py-2 hover:text-green-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <p className="text-xs font-medium">QR Okut</p>
          </Link>
          
          <Link 
            href="/schedule"
            className="flex flex-col items-center justify-end gap-1 text-gray-600 py-2 hover:text-green-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs font-medium">Geçmiş</p>
          </Link>
          
          <button className="flex flex-col items-center justify-end gap-1 text-green-600 py-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <p className="text-xs font-medium">QR Print</p>
          </button>
        </div>
      </footer>
    </div>
  )
}