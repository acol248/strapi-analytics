import { Flex } from '@strapi/design-system';
import styled from 'styled-components';

export const StyledDataCard = styled(Flex)`
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spaces[2]};
  padding: ${({ theme }) => theme.spaces[3]};
  width: 100%;
  height: 100%;
  background: ${({ theme }) => theme.colors.neutral0};
  border-radius: ${({ theme }) => theme.borderRadius};
  box-shadow: ${({ theme }) => theme.shadows.tableShadow};

  & .overview-card__content {
    word-break: break-all;
    overflow-wrap: anywhere;
    text-align: center;
  }
`;
