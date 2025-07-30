"use client";

import React from "react";

interface PrerequisiteNode {
    id: number;
    parentId: number | null;
    relationType: string | null;
    department: string | null;
    courseNumber: string | null;
    minGrade: number | null;
    title: string | null;
    depth: number;
    children: number[];
}

interface PrerequisiteTreeData {
    targetCourse: {
        department: string;
        courseNumber: string;
        title?: string;
    };
    nodes: Record<string, PrerequisiteNode>;
    rootNodes: number[];
    maxDepth: number;
    totalNodes: number;
}

interface TreeNode {
    id: string;
    nodeId: number;
    relationType?: string;
    department?: string;
    courseNumber?: string;
    title?: string;
    minGrade?: number;
    children: TreeNode[];
    isLeaf: boolean;
    depth: number;
}

interface PrerequisiteTreeVisualizationProps {
    data: PrerequisiteTreeData;
}

const PrerequisiteTreeVisualization: React.FC<PrerequisiteTreeVisualizationProps> = ({ data }) => {
    const buildTree = (nodes: Record<string, PrerequisiteNode>, rootNodeIds: number[]): TreeNode[] => {
        const nodeMap = new Map<string, TreeNode>();

        // First pass: create all tree nodes
        Object.values(nodes).forEach((node) => {
            const treeNode: TreeNode = {
                id: node.id.toString(),
                nodeId: node.id,
                relationType: node.relationType ?? undefined,
                department: node.department ?? undefined,
                courseNumber: node.courseNumber ?? undefined,
                title: node.title ?? undefined,
                minGrade: node.minGrade ?? undefined,
                children: [],
                isLeaf: node.department !== null && node.courseNumber !== null,
                depth: node.depth,
            };
            nodeMap.set(node.id.toString(), treeNode);
        });

        // Second pass: build parent-child relationships
        const rootNodes: TreeNode[] = [];
        Object.values(nodes).forEach((node) => {
            const treeNode = nodeMap.get(node.id.toString());
            if (!treeNode) return;

            if (rootNodeIds.includes(node.id)) {
                rootNodes.push(treeNode);
            } else {
                // Find parent and add this node as child
                const parentNode = nodeMap.get(node.parentId?.toString() ?? '');
                if (parentNode) {
                    parentNode.children.push(treeNode);
                }
            }
        });

        return rootNodes;
    };

    const renderNode = (node: TreeNode, level = 0): React.ReactNode => {
        const isCourse = node.department && node.courseNumber;
        const isRelation = node.relationType && !isCourse;

        return (
            <div key={node.id} className="flex flex-col items-center">
                {/* Node Content */}
                <div className={`px-4 py-2 rounded-lg border-2 font-medium text-sm min-w-[200px] text-center ${isRelation
                    ? 'bg-yellow-100 border-yellow-300 text-yellow-800'
                    : isCourse
                        ? 'bg-purple-100 border-purple-300 text-purple-800'
                        : 'bg-gray-100 border-gray-300 text-gray-800'
                    }`}>
                    {isRelation ? (
                        <div>
                            <div className="font-bold">{node.relationType}</div>
                            <div className="text-xs opacity-75">
                                {node.relationType === 'OR' ? 'Any One' : 'All Required'}
                            </div>
                        </div>
                    ) : isCourse ? (
                        <div>
                            <div className="font-bold">{node.department} {node.courseNumber}</div>
                            {node.title && (
                                <div className="text-xs opacity-75 mt-1 line-clamp-2">
                                    {node.title}
                                </div>
                            )}
                            {node.minGrade && (
                                <div className="text-xs opacity-75 mt-1">
                                    Min Grade: {node.minGrade}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-gray-600">Unknown Node</div>
                    )}
                </div>

                {/* Children */}
                {node.children.length > 0 && (
                    <div className="mt-4">
                        {/* Vertical line from parent to children */}
                        <div className="w-0.5 bg-gray-300 h-4 mx-auto mb-2"></div>

                        {/* Children container - horizontal layout for multiple children */}
                        <div className="flex items-start justify-center space-x-8">
                            {node.children.map((child, index) => (
                                <div key={child.id} className="flex flex-col items-center">
                                    {/* Horizontal line to child */}
                                    <div className="w-8 h-0.5 bg-gray-300 mb-2"></div>
                                    {renderNode(child, level + 1)}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const treeNodes = buildTree(data.nodes, data.rootNodes);

    if (treeNodes.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                No prerequisite structure found.
            </div>
        );
    }

    return (
        <div className="overflow-auto">
            <div className="flex flex-col items-center p-6">
                {/* Target Course */}
                <div className="mb-8">
                    <div className="px-6 py-3 bg-blue-100 border-2 border-blue-300 rounded-lg font-bold text-blue-800 text-center">
                        <div className="text-lg">{data.targetCourse.department} {data.targetCourse.courseNumber}</div>
                        {data.targetCourse.title && (
                            <div className="text-sm opacity-75 mt-1">{data.targetCourse.title}</div>
                        )}
                    </div>
                </div>

                {/* Prerequisites Tree */}
                <div className="flex flex-col items-center">
                    {treeNodes.map((node) => renderNode(node))}
                </div>
            </div>
        </div>
    );
};

export default PrerequisiteTreeVisualization; 
