'use client'

import { QRCodeSVG } from 'qrcode.react'
import { useState, useEffect } from 'react'

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
    <div className="min-h-screen bg-white">
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
    </div>
  )
}