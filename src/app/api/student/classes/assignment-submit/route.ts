import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/utils/Tools.ts';
import { getCollection } from '@/utils/MongoDB';
import { ObjectId } from 'mongodb';

type SubmissionData = {
    classId: string;
    weekNumber: number;
    fileUrl?: string;
    fileName?: string;
    audioUrl?: string;
    message?: string;
};

export async function POST(request: NextRequest) {
    try {
        const userId = await getUserId(request);
        const data: SubmissionData = await request.json();

        if (!data.fileUrl && !data.audioUrl) {
            return NextResponse.json(
                { error: 'Se requiere un archivo o audio' },
                { status: 400 }
            );
        }

        const submissionData = {
            weekNumber: data.weekNumber,
            fileUrl: data.fileUrl,
            audioUrl: data.audioUrl || null,
            fileName: data.fileName || null,
            message: data.message || '',
            updatedAt: new Date()
        };

        const submittedAssignmentsCollection = await getCollection('submittedAssignments');

        // Verificar si existe para actualizar
        const existingSubmission = await submittedAssignmentsCollection.findOne({
            weekNumber: data.weekNumber,
            studentId: new ObjectId(userId),
            classId: new ObjectId(data.classId)
        });

        if (existingSubmission) {
            await submittedAssignmentsCollection.updateOne(
                { _id: existingSubmission._id },
                { $set: submissionData}
            );
        } else {
            await submittedAssignmentsCollection.insertOne({
                classId: new ObjectId(data.classId),
                studentId: new ObjectId(userId),
                ...submissionData,
                submittedAt: new Date(),
                fileGrade: null,
                fileFeedback: null,
                audioGrade: null,
                audioFeedback: null,
                isGraded: false,
                overallGrade: null,
                overallFeedback: null
            });
        }

        return NextResponse.json({
            success: true
        });

    } catch (error) {
        console.error('Error submitting assignment:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}