"use client";

import React from "react";
import Link from "next/link";

interface PrerequisiteNode {
    id: number;
    parentId: number | null;
    relationType: string | null;
    department: string | null;
    courseNumber: string | null;
    title: string | null;
    children: number[];
    depth: number;
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

        const nodeContent = (
            <div className={`px-4 py-2 rounded-lg border-2 font-medium text-sm min-w-[200px] text-center ${isRelation
                ? 'bg-yellow-100 border-yellow-300 text-yellow-800'
                : isCourse
                    ? 'bg-purple-100 border-purple-300 text-purple-800 hover:bg-purple-200 hover:border-purple-400 transition-colors cursor-pointer'
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
                    </div>
                ) : (
                    <div className="text-gray-600">Unknown Node</div>
                )}
            </div>
        );

        return (
            <div key={node.id} className="flex flex-col items-center">
                {/* Node Content */}
                {isCourse ? (
                    <Link href={`/tree/${node.department}${node.courseNumber}`}>
                        {nodeContent}
                    </Link>
                ) : (
                    nodeContent
                )}

                {/* Children */}
                {node.children.length > 0 && (
                    <div className="mt-4 w-full">
                        {/* Vertical line from parent to children */}
                        <div className="w-0.5 bg-gray-300 h-4 mx-auto mb-2"></div>

                        {/* Children container with proper spacing and boundaries */}
                        <div className="flex items-start justify-center space-x-12 min-w-full">
                            {node.children.map((child, index) => (
                                <div key={child.id} className="flex flex-col items-center flex-1">
                                    {/* Horizontal line to child with better visual connection */}
                                    <div className="w-full h-0.5 bg-gray-300 mb-2 relative">
                                        {/* Add vertical connector at the end */}
                                        <div className="absolute right-0 top-0 w-0.5 bg-gray-300 h-2"></div>
                                    </div>
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
        <div className="w-full overflow-x-auto">
            <div className="flex flex-col items-center p-6 min-w-max">
                {/* Target Course */}
                <div className="mb-8">
                    <Link href={`/tree/${data.targetCourse.department}${data.targetCourse.courseNumber}`}>
                        <div className="px-6 py-3 bg-blue-100 border-2 border-blue-300 rounded-lg font-bold text-blue-800 text-center hover:bg-blue-200 hover:border-blue-400 transition-colors cursor-pointer">
                            <div className="text-lg">{data.targetCourse.department} {data.targetCourse.courseNumber}</div>
                            {data.targetCourse.title && (
                                <div className="text-sm opacity-75 mt-1">{data.targetCourse.title}</div>
                            )}
                        </div>
                    </Link>
                </div>

                {/* Prerequisites Tree */}
                <div className="flex flex-col items-center w-full">
                    {treeNodes.map((node) => renderNode(node))}
                </div>
            </div>
        </div>
    );
};

export default PrerequisiteTreeVisualization; 
