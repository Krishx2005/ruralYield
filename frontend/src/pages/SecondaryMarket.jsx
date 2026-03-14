import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { getMarketListings, createListing, buyListing, cancelListing } from '../api';

function SecondaryMarket() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [sellBondId, setSellBondId] = useState('');
  const [sellInvestmentId, setSellInvestmentId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const investorId = localStorage.getItem('investor_id') || '';

  const fetchListings = () => {
    setLoading(true);
    getMarketListings()
      .then((res) => setListings(res.listings || res || []))
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load market listings'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleBuy = async (listing) => {
    if (!investorId) {
      setError('Please set up your investor profile first.');
      return;
    }
    setActionLoading(true);
    try {
      await buyListing({
        listing_id: listing.id || listing.listing_id,
        buyer_id: investorId,
        buyer_name: localStorage.getItem('investor_name') || 'Anonymous',
      });
      fetchListings();
    } catch (err) {
      setError(err.response?.data?.detail || 'Purchase failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSell = async (e) => {
    e.preventDefault();
    if (!sellPrice || !sellBondId) return;
    setActionLoading(true);
    try {
      await createListing({
        bond_id: sellBondId,
        seller_id: investorId,
        seller_name: localStorage.getItem('investor_name') || 'Anonymous',
        asking_price: parseFloat(sellPrice),
        investment_id: sellInvestmentId || undefined,
      });
      setSellPrice('');
      setSellBondId('');
      setSellInvestmentId('');
      fetchListings();
    } catch (err) {
      setError(err.response?.data?.detail || 'Listing failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (listingId) => {
    setActionLoading(true);
    try {
      await cancelListing(listingId);
      fetchListings();
    } catch (err) {
      setError(err.response?.data?.detail || 'Cancel failed');
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (amt) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amt || 0);

  const myListings = listings.filter((l) => l.seller_id === investorId);
  const otherListings = listings.filter((l) => l.seller_id !== investorId);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-green)' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Source Sans 3, sans-serif' }}>
      <h1
        style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: 32,
          color: 'var(--text-primary)',
          marginBottom: 8,
        }}
      >
        Secondary Bond Market
      </h1>
      <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.6, maxWidth: 640 }}>
        Buy and sell existing bond positions. Trade your agricultural bond investments with other community members
        at market-driven prices.
      </p>

      {error && (
        <div
          style={{
            backgroundColor: 'rgba(239,68,68,0.1)',
            color: 'var(--accent-red)',
            padding: '12px 16px',
            borderRadius: 8,
            marginBottom: 24,
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      {/* Listings Grid */}
      {otherListings.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 20,
            marginBottom: 48,
          }}
        >
          {otherListings.map((listing) => {
            const discount = listing.original_investment && listing.asking_price < listing.original_investment
              ? Math.round(((listing.original_investment - listing.asking_price) / listing.original_investment) * 100)
              : 0;
            return (
              <div
                key={listing.id || listing.listing_id}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: 24,
                  boxShadow: 'var(--shadow-sm)',
                  position: 'relative',
                }}
              >
                {discount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      backgroundColor: 'var(--accent-green-dim)',
                      color: 'var(--accent-green)',
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '3px 10px',
                      borderRadius: 20,
                    }}
                  >
                    {discount}% discount
                  </span>
                )}
                <h3
                  style={{
                    fontFamily: 'Playfair Display, serif',
                    fontSize: 18,
                    color: 'var(--text-primary)',
                    marginBottom: 4,
                    paddingRight: discount > 0 ? 90 : 0,
                  }}
                >
                  {listing.bond_title || listing.bond_id}
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                  {listing.farmer_name || listing.seller_name}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Asking Price</div>
                    <div
                      style={{
                        fontFamily: 'Playfair Display, serif',
                        fontSize: 24,
                        fontWeight: 700,
                        color: 'var(--accent-green)',
                      }}
                    >
                      {formatCurrency(listing.asking_price)}
                    </div>
                  </div>
                  {listing.original_investment && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Original</div>
                      <div style={{ fontSize: 16, color: 'var(--text-secondary)', textDecoration: 'line-through' }}>
                        {formatCurrency(listing.original_investment)}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleBuy(listing)}
                  disabled={actionLoading}
                  style={{
                    width: '100%',
                    marginTop: 12,
                    padding: '10px 0',
                    backgroundColor: 'var(--accent-green)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'Source Sans 3, sans-serif',
                    transition: 'opacity 200ms',
                  }}
                >
                  {actionLoading ? 'Processing...' : 'Buy Position'}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          style={{
            textAlign: 'center',
            padding: 48,
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 12,
            marginBottom: 48,
            color: 'var(--text-muted)',
            fontSize: 15,
          }}
        >
          No listings available right now. Be the first to list a position!
        </div>
      )}

      {/* Sell Section */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 28,
          marginBottom: 32,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <h2
          style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 22,
            color: 'var(--text-primary)',
            marginBottom: 16,
          }}
        >
          Sell a Position
        </h2>
        <form onSubmit={handleSell} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
              Bond ID
            </label>
            <input
              type="text"
              value={sellBondId}
              onChange={(e) => setSellBondId(e.target.value)}
              placeholder="Bond ID"
              required
              style={{
                padding: '8px 12px',
                border: '1px solid var(--border)',
                borderRadius: 8,
                fontSize: 14,
                backgroundColor: '#ffffff',
                outline: 'none',
                width: 200,
                fontFamily: 'Source Sans 3, sans-serif',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
              Investment ID (optional)
            </label>
            <input
              type="text"
              value={sellInvestmentId}
              onChange={(e) => setSellInvestmentId(e.target.value)}
              placeholder="Investment ID"
              style={{
                padding: '8px 12px',
                border: '1px solid var(--border)',
                borderRadius: 8,
                fontSize: 14,
                backgroundColor: '#ffffff',
                outline: 'none',
                width: 160,
                fontFamily: 'Source Sans 3, sans-serif',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
              Asking Price ($)
            </label>
            <input
              type="number"
              value={sellPrice}
              onChange={(e) => setSellPrice(e.target.value)}
              placeholder="Price"
              min="1"
              step="0.01"
              required
              style={{
                padding: '8px 12px',
                border: '1px solid var(--border)',
                borderRadius: 8,
                fontSize: 14,
                backgroundColor: '#ffffff',
                outline: 'none',
                width: 120,
                fontFamily: 'Source Sans 3, sans-serif',
              }}
            />
          </div>
          <button
            type="submit"
            disabled={actionLoading}
            style={{
              padding: '8px 24px',
              backgroundColor: 'var(--accent-green)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'Source Sans 3, sans-serif',
              height: 38,
            }}
          >
            {actionLoading ? 'Listing...' : 'List for Sale'}
          </button>
        </form>
      </div>

      {/* My Listings */}
      {myListings.length > 0 && (
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 28,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h2
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: 22,
              color: 'var(--text-primary)',
              marginBottom: 16,
            }}
          >
            My Active Listings
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {myListings.map((listing) => (
              <div
                key={listing.id || listing.listing_id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 8,
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                    {listing.bond_title || listing.bond_id}
                  </span>
                  <span style={{ marginLeft: 12, fontSize: 13, color: 'var(--accent-green)', fontWeight: 600 }}>
                    {formatCurrency(listing.asking_price)}
                  </span>
                </div>
                <button
                  onClick={() => handleCancel(listing.id || listing.listing_id)}
                  disabled={actionLoading}
                  style={{
                    padding: '6px 16px',
                    backgroundColor: 'transparent',
                    color: 'var(--accent-red)',
                    border: '1px solid var(--accent-red)',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'Source Sans 3, sans-serif',
                  }}
                >
                  Cancel Listing
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SecondaryMarket;
