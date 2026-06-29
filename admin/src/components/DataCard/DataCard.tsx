// Strapi
import { Typography } from '@strapi/design-system';

// Styles
import { StyledDataCard } from './DataCard.style';

// Types
export interface Props {
  label: string;
  value: string | number;
}

/**
 * Reusable card component for displaying key metrics in the overview section
 * @param param0 Component props
 * @param param0.label Card label
 * @param param0.value Card value
 * @returns JSX element representing a data card
 */
const DataCard = ({ label, value }: Props) => {
  return (
    <StyledDataCard>
      <Typography className="overview-card__label" variant="delta">
        {label}
      </Typography>
      <Typography className="overview-card__content" variant="alpha">
        {value}
      </Typography>
    </StyledDataCard>
  );
};

export default DataCard;
