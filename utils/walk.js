/* This file is a part of @mdn/browser-compat-data
 * See LICENSE file for more information. */

import bcd from '../index.js';
import { isBrowser, descendantKeys, joinPath } from './walkingUtils.js';
import query from './query.js';

export function* browserReleaseWalk(data, path) {
  for (const [release, releaseData] of Object.entries(data.releases)) {
    yield {
      path: joinPath(path, 'releases', release),
      browser: data,
      browserRelease: releaseData,
    };
  }
}

export function* lowLevelWalk(data = bcd, path, depth = Infinity) {
  if (path !== undefined && path !== '__meta') {
    const next = {
      path,
      data,
    };

    if (isBrowser(data)) {
      next.browser = data;
      yield next;
      yield* browserReleaseWalk(data, path);
    } else {
      if (data.__compat !== undefined) {
        next.compat = data.__compat;
      }
      yield next;
    }
  }

  if (depth > 0) {
    for (const key of descendantKeys(data)) {
      yield* lowLevelWalk(data[key], joinPath(path, key), depth - 1);
    }
  }
}

export default function* walk(entryPoints, data = bcd) {
  const walkers = [];

  if (entryPoints === undefined) {
    walkers.push(lowLevelWalk(data));
  } else {
    entryPoints = Array.isArray(entryPoints) ? entryPoints : [entryPoints];
    walkers.push(
      ...entryPoints.map((entryPoint) =>
        lowLevelWalk(query(entryPoint, data), entryPoint),
      ),
    );
  }

  for (const walker of walkers) {
    for (const step of walker) {
      if (step.compat) {
        yield step;
      }
    }
  }
}
