'use client';

import React, { useState, useEffect } from 'react';
import { Voter, Role } from '../store/types';
import VoterForm from '../components/VoterForm';
import VoterTable from '../components/VoterTable';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { toast } from '../components/ui/Use-toast';
import { getVotersByElectionId, saveVoters } from '../api/voterApi';
import { getRoles, assignRoleToVoter } from '../api/roleApi';
import { useDispatch, useSelector } from 'react-redux';
import { setVoters, addVoter, updateVoter, setLoading, setError } from '../store/votersSlice';
import { setRoles } from '../store/roleSlice';
import { RootState } from '../store/store';

interface VoterManagementProps {
  electionId: string;
  darkMode: boolean;
}

export default function VoterManagement({ electionId, darkMode }: VoterManagementProps) {
  const dispatch = useDispatch();
  const voters = useSelector((state: RootState) => state.voters.voters);
  const roles = useSelector((state: RootState) => state.roles);
  const loading = useSelector((state: RootState) => state.voters.loading);
  const error = useSelector((state: RootState) => state.voters.error);

  useEffect(() => {
    const fetchData = async () => {
      dispatch(setLoading(true));
      try {
        const [fetchedVoters, fetchedRoles] = await Promise.all([
          getVotersByElectionId(electionId),
          getRoles(),
        ]);
        dispatch(setVoters(fetchedVoters));
        dispatch(setRoles(fetchedRoles));
      } catch (error) {
        console.error('Error loading data:', error);
        dispatch(setError('Failed to load data. Please try again later.'));
        toast({
          title: 'Error',
          description: 'Failed to load voter data. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        dispatch(setLoading(false));
      }
    };

    fetchData();
  }, [electionId, dispatch]);

  const handleSaveVoters = async (newVoters: Voter[]) => {
    try {
      dispatch(setLoading(true));
      const savedVoters = await saveVoters(electionId, newVoters);
      savedVoters.forEach((voter) => dispatch(addVoter(voter)));
      toast({
        title: 'Success',
        description: 'New voters have been saved.',
      });
    } catch (error) {
      console.error('Error saving voters:', error);
      toast({
        title: 'Error',
        description: 'Failed to save new voters. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleAssignRole = async (voter: Voter, roleId: number) => {
    try {
      dispatch(setLoading(true));
      await assignRoleToVoter(electionId, voter.phone, roleId);
      dispatch(updateVoter({ ...voter, roleId }));
      toast({
        title: 'Success',
        description: `Role updated for voter ${voter.name}.`,
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update role. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      dispatch(setLoading(false));
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
  }

  return (
    <div className={`min-h-screen p-4 ${darkMode ? 'dark' : ''}`}>
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Quản Lý Cử Tri</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list">Danh Sách Cử Tri</TabsTrigger>
              <TabsTrigger value="add">Thêm Cử Tri</TabsTrigger>
            </TabsList>
            <TabsContent value="list">
              <VoterTable
                voters={voters}
                roles={roles}
                onAssignRole={handleAssignRole}
                isEditPage={true}
              />
            </TabsContent>
            <TabsContent value="add">
              <VoterForm onSave={handleSaveVoters} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
