function normalizeIndex(length: number, index: number): number {
  return index < 0 ? Math.max(length + index, 0) : index;
}

function defineAt<T extends { prototype: Record<string, unknown> }>(ctor: T | undefined): void {
  if (!ctor || ctor.prototype.at) {
    return;
  }

  Object.defineProperty(ctor.prototype, 'at', {
    value: function at(index: number) {
      const normalizedIndex = normalizeIndex(this.length, Number(index) || 0);
      return this[normalizedIndex];
    },
    writable: true,
    configurable: true,
  });
}

defineAt(Array);
defineAt(Int8Array);
defineAt(Uint8Array);
defineAt(Uint8ClampedArray);
defineAt(Int16Array);
defineAt(Uint16Array);
defineAt(Int32Array);
defineAt(Uint32Array);
defineAt(Float32Array);
defineAt(Float64Array);
defineAt(BigInt64Array);
defineAt(BigUint64Array);

if (!String.prototype.at) {
  Object.defineProperty(String.prototype, 'at', {
    value: function at(index: number) {
      const normalizedIndex = normalizeIndex(this.length, Number(index) || 0);
      return this.charAt(normalizedIndex);
    },
    writable: true,
    configurable: true,
  });
}
