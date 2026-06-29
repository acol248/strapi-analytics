import { Flex } from '@strapi/design-system';
import styled from 'styled-components';

export const StyledDataCard = styled(Flex)`
  container-type: inline-size;

  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spaces[2]};
  padding: ${({ theme }) => theme.spaces[5]};
  width: 100%;
  height: 100%;
  background: ${({ theme }) => theme.colors.neutral0};
  border-radius: ${({ theme }) => theme.borderRadius};
  box-shadow: ${({ theme }) => theme.shadows.tableShadow};

  & .overview-card__content {
    word-break: break-all;
    overflow-wrap: anywhere;
    text-align: center;
    font-size: ${({ theme }) => theme.fontSizes[7]};
  }

  @container (min-width: 128px) {
    & .overview-card__content {
      font-size: 2.8rem;
    }
  }

  @container (min-width: 256px) {
    & .overview-card__content {
      font-size: 4.2rem;
    }
  }

  @container (min-width: 352px) {
    & .overview-card__content {
      font-size: 5.4rem;
    }
  }
`;
