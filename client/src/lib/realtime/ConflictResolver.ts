/**
 * Conflict Resolution System
 * Handles concurrent editing conflicts using various resolution strategies
 */

import type { 
  ConflictDetectedEvent, 
  ConflictResolution, 
  OperationalTransform 
} from '@/types/realtime';

export class ConflictResolver {
  private resolvers = new Map<string, ConflictResolverFunction>();
  
  constructor() {
    this.setupDefaultResolvers();
  }

  /**
   * Resolve a detected conflict
   */
  public async resolveConflict(event: ConflictDetectedEvent): Promise<ConflictResolution | null> {
    const { payload } = event;
    const { resourceType, conflictType, localVersion, serverVersion } = payload;

    console.log(`ConflictResolver: Resolving ${conflictType} conflict for ${resourceType}`);

    try {
      // Get appropriate resolver
      const resolverKey = `${resourceType}:${conflictType}`;
      const resolver = this.resolvers.get(resolverKey) || this.resolvers.get('default');

      if (!resolver) {
        console.error(`ConflictResolver: No resolver found for ${resolverKey}`);
        return null;
      }

      // Execute resolution strategy
      const resolution = await resolver(event);
      
      console.log(`ConflictResolver: Resolved conflict using ${resolution.strategy} strategy`);
      return resolution;

    } catch (error) {
      console.error('ConflictResolver: Failed to resolve conflict:', error);
      return null;
    }
  }

  /**
   * Register a custom conflict resolver
   */
  public registerResolver(key: string, resolver: ConflictResolverFunction): void {
    this.resolvers.set(key, resolver);
    console.log(`ConflictResolver: Registered resolver for ${key}`);
  }

  /**
   * Setup default conflict resolution strategies
   */
  private setupDefaultResolvers(): void {
    // Default last-write-wins strategy
    this.registerResolver('default', this.createLastWriteWinsResolver());
    
    // Schedule-specific resolvers
    this.registerResolver('schedule:concurrent_edit', this.createScheduleOperationalTransformResolver());
    this.registerResolver('schedule:version_mismatch', this.createVersionMismatchResolver());
    
    // Project-specific resolvers
    this.registerResolver('project:concurrent_edit', this.createProjectMergeResolver());
    this.registerResolver('project:version_mismatch', this.createLastWriteWinsResolver());
  }

  /**
   * Last-write-wins conflict resolution strategy
   */
  private createLastWriteWinsResolver(): ConflictResolverFunction {
    return async (event: ConflictDetectedEvent): Promise<ConflictResolution> => {
      const { payload } = event;
      
      return {
        strategy: 'last-write-wins',
        version: Math.max(payload.localVersion, payload.serverVersion) + 1,
        timestamp: Date.now(),
        userId: 'system', // This would come from auth context
        mergedData: null // Server version wins
      };
    };
  }

  /**
   * Operational Transform resolver for schedule conflicts
   */
  private createScheduleOperationalTransformResolver(): ConflictResolverFunction {
    return async (event: ConflictDetectedEvent): Promise<ConflictResolution> => {
      const { payload } = event;
      
      // For schedule conflicts, we need to transform the operations
      const transforms = this.generateScheduleTransforms(payload);
      
      return {
        strategy: 'operational-transform',
        version: Math.max(payload.localVersion, payload.serverVersion) + 1,
        timestamp: Date.now(),
        userId: 'system',
        mergedData: {
          transforms,
          originalData: payload
        }
      };
    };
  }

  /**
   * Version mismatch resolver - fetches latest and reapplies changes
   */
  private createVersionMismatchResolver(): ConflictResolverFunction {
    return async (event: ConflictDetectedEvent): Promise<ConflictResolution> => {
      const { payload } = event;
      
      // For version mismatches, we need to fetch the latest version
      // and try to reapply local changes
      
      return {
        strategy: 'operational-transform',
        version: payload.serverVersion + 1,
        timestamp: Date.now(),
        userId: 'system',
        mergedData: {
          needsRefetch: true,
          localChanges: payload
        }
      };
    };
  }

  /**
   * Project merge resolver - merges non-conflicting fields
   */
  private createProjectMergeResolver(): ConflictResolverFunction {
    return async (event: ConflictDetectedEvent): Promise<ConflictResolution> => {
      const { payload } = event;
      
      // For project updates, we can often merge non-conflicting fields
      const mergedData = this.mergeProjectData(payload);
      
      return {
        strategy: 'crdt',
        version: Math.max(payload.localVersion, payload.serverVersion) + 1,
        timestamp: Date.now(),
        userId: 'system',
        mergedData
      };
    };
  }

  /**
   * Generate operational transforms for schedule conflicts
   */
  private generateScheduleTransforms(conflictData: any): OperationalTransform[] {
    const transforms: OperationalTransform[] = [];
    
    // This is a simplified implementation
    // In a real system, you'd analyze the specific changes and generate appropriate transforms
    
    if (conflictData.localChanges && conflictData.serverChanges) {
      // Example: if both changed the title, keep the server version
      if (conflictData.localChanges.title !== conflictData.serverChanges.title) {
        transforms.push({
          operation: 'replace',
          position: 0,
          content: conflictData.serverChanges.title,
          attributes: { field: 'title' }
        });
      }
      
      // Example: if both changed the time, merge them intelligently
      if (conflictData.localChanges.starts_at_utc !== conflictData.serverChanges.starts_at_utc) {
        // Use the later of the two start times (more conservative)
        const localTime = new Date(conflictData.localChanges.starts_at_utc);
        const serverTime = new Date(conflictData.serverChanges.starts_at_utc);
        const mergedTime = localTime > serverTime ? localTime : serverTime;
        
        transforms.push({
          operation: 'replace',
          position: 0,
          content: mergedTime.toISOString(),
          attributes: { field: 'starts_at_utc' }
        });
      }
    }
    
    return transforms;
  }

  /**
   * Merge project data for non-conflicting fields
   */
  private mergeProjectData(conflictData: any): any {
    // This is a simplified merge strategy
    // In a real system, you'd have more sophisticated merge logic
    
    const merged = {
      ...conflictData.serverChanges,
      ...conflictData.localChanges
    };
    
    // Handle specific merge cases
    if (conflictData.serverChanges?.metadata && conflictData.localChanges?.metadata) {
      merged.metadata = {
        ...conflictData.serverChanges.metadata,
        ...conflictData.localChanges.metadata
      };
    }
    
    // Timestamps should use server version
    if (conflictData.serverChanges?.updated_at) {
      merged.updated_at = conflictData.serverChanges.updated_at;
    }
    
    return merged;
  }

  /**
   * Apply operational transforms to data
   */
  public applyTransforms(data: any, transforms: OperationalTransform[]): any {
    let result = JSON.parse(JSON.stringify(data)); // Deep clone
    
    for (const transform of transforms) {
      switch (transform.operation) {
        case 'replace':
          if (transform.attributes?.field) {
            result[transform.attributes.field] = transform.content;
          }
          break;
          
        case 'insert':
          // Handle array insertions or text insertions
          if (Array.isArray(result) && typeof transform.position === 'number') {
            result.splice(transform.position, 0, transform.content);
          }
          break;
          
        case 'delete':
          // Handle deletions
          if (Array.isArray(result) && typeof transform.position === 'number') {
            result.splice(transform.position, transform.length || 1);
          }
          break;
          
        case 'retain':
          // No-op, just advances position
          break;
      }
    }
    
    return result;
  }

  /**
   * Check if two data objects have conflicts
   */
  public detectConflicts(local: any, server: any): boolean {
    // Simplified conflict detection
    // In practice, you'd compare field-by-field and consider timestamps
    
    if (!local || !server) return false;
    
    // Check for obvious conflicts
    const conflictFields = ['title', 'description', 'starts_at_utc', 'ends_at_utc'];
    
    for (const field of conflictFields) {
      if (local[field] !== server[field] && local[field] && server[field]) {
        return true;
      }
    }
    
    return false;
  }
}

/**
 * Conflict resolver function type
 */
type ConflictResolverFunction = (event: ConflictDetectedEvent) => Promise<ConflictResolution>;