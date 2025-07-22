"use client";

import type React from "react";
import type { CourseTreeNode } from "~/models";

interface CourseTreeVisualizationProps {
    tree: CourseTreeNode;
}

interface TreeNodeProps {
    node: CourseTreeNode;
    level: number;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, level }) => {
    const hasChildren = node.children && node.children.length > 0;
    const isCourse = node.department && node.courseNumber;

    // Color scheme based on depth and type
    const getNodeColor = () => {
        if (!isCourse) {
            // Logic nodes (AND/OR)
            return node.relationType === 'OR'
                ? 'bg-yellow-100 border-yellow-300 text-yellow-800'
                : 'bg-blue-100 border-blue-300 text-blue-800';
        }

        // Course nodes with depth-based coloring
        const colors = [
            'bg-green-100 border-green-300 text-green-800',
            'bg-purple-100 border-purple-300 text-purple-800',
            'bg-pink-100 border-pink-300 text-pink-800',
            'bg-indigo-100 border-indigo-300 text-indigo-800',
            'bg-orange-100 border-orange-300 text-orange-800',
        ];
        return colors[level % colors.length] ?? 'bg-gray-100 border-gray-300 text-gray-800';
    };

    return (
        <div className="flex flex-col">
            {/* Current Node */}
            <div className="flex items-center">
                {/* Horizontal line from parent (except for root) */}
                {level > 0 && (
                    <div className="w-8 h-0.5 bg-gray-300 mr-2" />
                )}

                {/* Node Content */}
                <div className={`
                    px-4 py-3 rounded-lg border-2 shadow-sm whitespace-nowrap
                    ${getNodeColor()}
                `}>
                    {isCourse ? (
                        <div className="text-center">
                            <div className="font-bold text-sm">
                                {node.department} {node.courseNumber}
                            </div>
                            {node.title && (
                                <div className="text-xs mt-1 opacity-80 max-w-[200px] line-clamp-2">
                                    {node.title}
                                </div>
                            )}
                            {node.minGrade && (
                                <div className="text-xs mt-1 font-medium">
                                    Min Grade: {node.minGrade}%
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center">
                            <div className="font-bold text-sm">
                                {node.relationType ?? 'ROOT'}
                            </div>
                            <div className="text-xs opacity-80">
                                {node.relationType === 'AND' ? 'All Required' :
                                    node.relationType === 'OR' ? 'Any One' : 'Logic Node'}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Children */}
            {hasChildren && node.children && (
                <div className="ml-6 mt-4 relative">
                    {/* Vertical line connecting to children */}
                    <div className="absolute left-[-12px] top-0 w-0.5 bg-gray-300 h-full" />

                    <div className="space-y-6">
                        {node.children.map((child) => (
                            <div key={child.id} className="relative">
                                {/* Vertical line from parent to this child */}
                                <div className="absolute left-[-12px] top-4 w-0.5 bg-gray-300 h-4" />

                                <TreeNode
                                    node={child}
                                    level={level + 1}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const CourseTreeVisualization: React.FC<CourseTreeVisualizationProps> = ({ tree }) => {
    return (
        <div className="w-full overflow-auto">
            <div className="p-8">
                {/* Tree Container */}
                <div className="flex justify-start">
                    <TreeNode node={tree} level={0} />
                </div>

                {/* Legend */}
                <div className="mt-12 pt-6 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Legend:</h3>
                    <div className="flex flex-wrap gap-4 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                            <span>Course (Level 1)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded"></div>
                            <span>Course (Level 2)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-pink-100 border border-pink-300 rounded"></div>
                            <span>Course (Level 3)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
                            <span>AND (All Required)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
                            <span>OR (Any One)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseTreeVisualization;
