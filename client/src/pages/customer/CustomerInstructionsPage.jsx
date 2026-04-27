import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'

const Section = ({ title, children }) => (
  <div className="form-section">
    <h2 className="font-display text-lg font-bold text-white">{title}</h2>
    <div className="text-sm text-slate-300 leading-relaxed">{children}</div>
  </div>
)

const BulletList = ({ items }) => (
  <ul className="mt-3 space-y-2 list-disc list-inside text-slate-400 text-sm">
    {items.map((it) => (
      <li key={it}>{it}</li>
    ))}
  </ul>
)

export default function CustomerInstructionsPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6 animate-slide-up">
        <div className="page-header">
          <h1 className="page-title">ParcelFlow – Customer Instructions & Disclaimer</h1>
          <p className="page-subtitle">
            Please read carefully before booking. These rules help keep trips safe and smooth.
          </p>
        </div>

        <Section title="About ParcelFlow">
          <p>
            ParcelFlow is only a platform to connect customers and drivers. We do not provide delivery service. We only
            arrange trips between you and the driver.
          </p>
        </Section>

        <Section title="Before Booking">
          <BulletList
            items={[
              'Enter the correct pickup and delivery address.',
              'Provide a valid phone number.',
              'Add clear parcel details (what it is, weight, and special handling notes).',
            ]}
          />
        </Section>

        <Section title="Parcel Packaging">
          <BulletList
            items={[
              'Pack your parcel properly and securely.',
              'Use a strong box/cover.',
              'Mention clearly if the item is fragile.',
            ]}
          />
        </Section>

        <Section title="Not Allowed Items">
          <p className="text-slate-300">Do NOT send:</p>
          <BulletList
            items={[
              'Illegal items.',
              'Dangerous or explosive items.',
              'Drugs or restricted goods.',
            ]}
          />
          <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-200">
            If any restricted item is found, the booking will be cancelled.
          </div>
        </Section>

        <Section title="Pickup Rules">
          <BulletList
            items={[
              'Be available at the pickup location on time.',
              'Keep the parcel ready.',
              'The driver will wait a maximum of 30 minutes.',
            ]}
          />
        </Section>

        <Section title="Delivery Rules">
          <BulletList
            items={[
              'The receiver must be available at the delivery location.',
              'Keep the phone reachable.',
              'Share correct receiver details.',
            ]}
          />
        </Section>

        <Section title="Payment">
          <BulletList
            items={[
              'Payment is Cash on Delivery (COD).',
              'Pay directly to the driver.',
              'ParcelFlow does not handle payments.',
            ]}
          />
        </Section>

        <Section title="Delays">
          <BulletList
            items={[
              'Delivery time is not guaranteed.',
              'Delays can happen due to traffic or other reasons.',
            ]}
          />
        </Section>

        <Section title="Safety Tips">
          <BulletList
            items={[
              'Do not send high-value items without informing the driver.',
              'Verify the driver before handing over the parcel.',
            ]}
          />
        </Section>

        <Section title="Platform Rules">
          <BulletList
            items={[
              'Do not make deals outside ParcelFlow.',
              'Do not share personal contact details.',
              'Misuse can result in account suspension.',
            ]}
          />
        </Section>

        <Section title="Important Disclaimer">
          <p className="text-slate-300 mb-2">ParcelFlow is not responsible for:</p>
          <BulletList
            items={[
              'Parcel loss.',
              'Parcel damage.',
              'Delivery delay.',
              'Driver behavior.',
            ]}
          />
          <div className="mt-4 bg-slate-800/40 border border-slate-700 rounded-xl p-4 text-sm text-slate-300">
            We only connect the customer and the driver. All responsibility is between you and the driver.
          </div>
        </Section>

        <div className="card p-6">
          <h2 className="font-display text-lg font-bold text-white">Final Agreement</h2>
          <p className="text-slate-400 text-sm mt-2">
            By continuing, you agree to follow all the above rules and use ParcelFlow at your own risk.
          </p>
          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            <Link to="/trips" className="btn-secondary flex-1 text-center">
              Browse Trips
            </Link>
            <button
              type="button"
              onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/', { replace: true }))}
              className="btn-primary flex-1 text-center"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
