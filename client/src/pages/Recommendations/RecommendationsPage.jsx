import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Lightbulb, Shirt, Tag, Layers, Flame, Check, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Select } from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/StateDisplay';
import { RecommendationCard } from '../../components/cards';
import './Recommendations.css';

function RecommendationsPage() {
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState('all');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRecs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.recommendations.list({
        type: filterType !== 'all' ? filterType : undefined,
      });
      setRecommendations(res.data || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    fetchRecs();
  }, [fetchRecs]);

  return (
    <div className="page">
      <div className="container">
        <div className="pd-header">
          <div>
            <span className="editorial-eyebrow">Curated Lifestyle & Style Guidance</span>
            <h1 className="page__title">Personal Recommendations</h1>
            <p className="page__subtitle">Suggestions tailored to your current wardrobe, climate, and daily habits</p>
          </div>
          <Select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'style', label: 'Styles' },
              { value: 'item', label: 'Wardrobe Essentials' },
              { value: 'outfit', label: 'Outfits' },
              { value: 'habit', label: 'Habits' }
            ]}
            placeholder=""
          />
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <EmptyState icon={AlertTriangle} title="Error loading recommendations" description={error} action={fetchRecs} actionLabel="Try Again" />
        ) : recommendations.length === 0 ? (
          <EmptyState icon={Lightbulb} title="No recommendations available" description="Add wardrobe items, set goals, or track habits to receive customized recommendations." />
        ) : (
          <div className="rec-grid">
            {recommendations.map(rec => (
              <RecommendationCard
                key={rec.id}
                recommendation={{
                  title: rec.title,
                  description: rec.description || rec.desc,
                  occasion: rec.type,
                  rationale: rec.reason,
                  image: rec.image,
                  tags: rec.tags,
                }}
                onOpenDetails={() => {
                  const target = rec.type === 'brand' ? '/brands' :
                    rec.type === 'style' ? '/fashion' :
                    rec.type === 'item' ? '/wardrobe' :
                    rec.type === 'outfit' ? '/outfits' :
                    '/personal-development';
                  navigate(target);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default RecommendationsPage;
