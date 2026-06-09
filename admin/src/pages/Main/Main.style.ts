import { Flex } from '@strapi/design-system';
import styled from 'styled-components';

export const StyledOverviewCard = styled(Flex)`
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spaces[2]};
  padding: ${({ theme }) => theme.spaces[3]};
  width: 100%;
  background: ${({ theme }) => theme.colors.neutral0};
  border-radius: ${({ theme }) => theme.borderRadius};
  box-shadow: ${({ theme }) => theme.shadows.tableShadow};
  aspect-ratio: 3 / 2;
`;
