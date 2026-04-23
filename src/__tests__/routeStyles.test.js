import { describe, it, expect } from 'vitest'
import { buildRouteStyleMap, getRouteBadgeStyle } from '../utils/routeStyles'

describe('routeStyles', () => {
  describe('buildRouteStyleMap', () => {
    it('creates a map for multiple route identifiers', () => {
      const routes = [
        { routeId: 'r1', name: 'Orbit', color: '#ff0000', aliases: ['OR'] }
      ]
      const styleMap = buildRouteStyleMap(routes)
      
      expect(styleMap['orbit']).toEqual({
        backgroundColor: '#ff0000',
        color: '#ffffff',
        borderColor: '#ff0000'
      })
      expect(styleMap['r1']).toEqual(styleMap['orbit'])
      expect(styleMap['or']).toEqual(styleMap['orbit'])
    })

    it( 'handles legacy 6-digit hex colors without #', () => {
      const routes = [{ name: 'Test', color: '00ff00' }]
      const styleMap = buildRouteStyleMap(routes)
      expect(styleMap['test'].backgroundColor).toBe('#00ff00')
      expect(styleMap['test'].color).toBe('#ffffff') // At current 155 threshold, #00ff00 gets white
    })

    it('falls back to default color for invalid inputs', () => {
      const routes = [{ name: 'Bad', color: 'notacolor' }]
      const styleMap = buildRouteStyleMap(routes)
      expect(styleMap['bad'].backgroundColor).toBe('#BA0C2F')
    })
  })

  describe('getRouteBadgeStyle', () => {
    it('returns style from map if exists', () => {
      const map = { 'orbit': { backgroundColor: '#123', color: '#fff' } }
      const style = getRouteBadgeStyle('Orbit', map)
      expect(style.backgroundColor).toBe('#123')
    })

    it('returns default style if name not in map', () => {
      const style = getRouteBadgeStyle('Unknown', {})
      expect(style.backgroundColor).toBe('#BA0C2F')
    })
  })
})
