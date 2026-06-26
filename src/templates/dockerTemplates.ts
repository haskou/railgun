export function dockerfile(nodeVersion: string): string {
  return `ARG NODE_VERSION=${nodeVersion}

FROM node:\${NODE_VERSION}-bullseye AS build
ENV NODE_OPTIONS=--max_old_space_size=4096
WORKDIR /var/www/
COPY package.json yarn.lock ./
RUN yarn --prefer-offline --frozen-lockfile --ignore-engines
COPY src ./src
COPY tsconfig.json .
COPY tsconfig.build.json .
ENV NODE_ENV=build
RUN yarn build

FROM node:\${NODE_VERSION}-bullseye-slim AS runtime
ENV NODE_ENV=production
WORKDIR /var/www/
COPY package.json yarn.lock ./
RUN yarn --ignore-engines --frozen-lockfile --production && yarn cache clean
COPY --from=build /var/www/dist ./dist
CMD yarn start

FROM node:\${NODE_VERSION}-bullseye AS local
ENV NODE_OPTIONS=--max_old_space_size=4096
WORKDIR /var/www/
COPY package.json yarn.lock ./
RUN yarn --ignore-engines
COPY . ./
ENV NODE_ENV=local
CMD yarn local

FROM build AS tests
COPY tests ./tests
COPY jest.config.ts .
COPY tsconfig.jest.json .
ENV NODE_ENV=test
RUN yarn test
`;
}

export function dockerCompose(projectName: string): string {
  const serviceName = projectName.replace(/[^a-zA-Z0-9]+/g, "_");

  return `services:
  backend:
    container_name: "${serviceName}"
    build:
      target: local
      context: .
    ports:
      - "8080:8080"
    volumes:
      - ./:/var/www
      - /var/www/node_modules
      - /var/www/dist
    env_file:
      - .env.local
    environment:
      NODE_ENV: local
`;
}
